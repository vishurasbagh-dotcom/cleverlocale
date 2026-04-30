"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { categoryIsLeaf } from "@/lib/category-queries";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { vendorShopfrontLive } from "@/lib/vendor-shopfront-live";

const productSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  priceRupees: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  categoryId: z.string().min(1, "Select a shelf category."),
  isPublished: z.coerce.boolean().optional(),
});

export type ProductFormState = { error?: string; success?: boolean };

export async function createVendorProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "VENDOR" && session.user.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true, isShopOpen: true, isAdminShopClosed: true },
  });
  if (!vendor) {
    return { error: "Vendor profile not found." };
  }
  if (!vendorShopfrontLive(vendor)) {
    return {
      error:
        "Your shop must be live on the marketplace to add or change products. Open it from the vendor dashboard, or wait if CL Admin has temporarily closed your shop.",
    };
  }

  const rawSlug = formData.get("slug");
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: rawSlug && String(rawSlug).trim() ? rawSlug : undefined,
    description: formData.get("description") || undefined,
    priceRupees: formData.get("priceRupees"),
    stock: formData.get("stock"),
    categoryId: formData.get("categoryId"),
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

  const cat = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!cat || !(await categoryIsLeaf(categoryId))) {
    return {
      error:
        "Choose a shelf category — the most specific category with no subcategories (add subcategories in Admin if needed).",
    };
  }
  const resolvedCategoryId = cat.id;

  await prisma.product.create({
    data: {
      vendorId: vendor.id,
      categoryId: resolvedCategoryId,
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
