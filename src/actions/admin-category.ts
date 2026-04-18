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

const schema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
});

export type CategoryState = { error?: string; success?: boolean };

export async function createCategory(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const rawSlug = formData.get("slug");
  const parsed = schema.safeParse({
    name: formData.get("name"),
    slug: rawSlug && String(rawSlug).trim() ? rawSlug : undefined,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors.join(" ") || "Invalid input" };
  }

  const name = parsed.data.name;
  const slug = parsed.data.slug?.length ? slugify(parsed.data.slug) : slugify(name);

  const exists = await prisma.category.findUnique({ where: { slug } });
  if (exists) {
    return { error: "A category with this slug already exists." };
  }

  await prisma.category.create({
    data: {
      name,
      slug,
      description: parsed.data.description || null,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/products");
  return { success: true };
}
