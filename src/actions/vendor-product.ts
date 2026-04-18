"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const productSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  priceRupees: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  categoryId: z.string().optional(),
  isPublished: z.coerce.boolean().optional(),
});

export type ProductFormState = { error?: string; success?: boolean };

export async function createVendorProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "VENDOR" && session.user.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }

  const vendor = await prisma.vendor.findUnique({ where: { userId: session.user.id } });
  if (!vendor) {
    return { error: "Vendor profile not found." };
  }
  if (vendor.status !== "APPROVED") {
    return { error: "Your shop is not approved yet." };
  }

  const rawSlug = formData.get("slug");
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: rawSlug && String(rawSlug).trim() ? rawSlug : undefined,
    description: formData.get("description") || undefined,
    priceRupees: formData.get("priceRupees"),
    stock: formData.get("stock"),
    categoryId: formData.get("categoryId") || undefined,
    isPublished: formData.get("isPublished") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors.join(" ") || "Invalid input" };
  }

  const { name, description, priceRupees, stock, categoryId, isPublished } = parsed.data;
  const slug = parsed.data.slug?.length ? slugify(parsed.data.slug) : slugify(name);

  const pricePaise = Math.round(priceRupees * 100);

  const clash = await prisma.product.findUnique({
    where: { vendorId_slug: { vendorId: vendor.id, slug } },
  });
  if (clash) {
    return { error: "Another product already uses this URL slug. Change the name or slug." };
  }

  await prisma.product.create({
    data: {
      vendorId: vendor.id,
      categoryId: categoryId || null,
      name,
      slug,
      description: description || null,
      pricePaise,
      stock,
      isPublished: Boolean(isPublished),
    },
  });

  revalidatePath("/vendor/products");
  revalidatePath("/products");
  revalidatePath("/p");
  return { success: true };
}
