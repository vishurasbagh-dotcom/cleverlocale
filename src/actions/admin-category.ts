"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { collectSubtreeCategoryIds, proposeCategorySlug } from "@/lib/category-queries";
import { prisma } from "@/lib/prisma";

export type CategoryFormState = { error?: string; success?: string };

const createSchema = z.object({
  categoryType: z.enum(["PRIMARY", "CHILD"]),
  name: z.string().min(1, "Name is required.").max(120),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
});

export async function createCategory(_prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  void _prev;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const rawParent = formData.get("parentId");
  const parentId =
    typeof rawParent === "string" && rawParent.trim() ? rawParent.trim() : null;

  const parsed = createSchema.safeParse({
    categoryType: formData.get("categoryType"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    parentId: parentId ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors.join(" ") || "Invalid input" };
  }

  const { categoryType, name, description } = parsed.data;

  let resolvedParentId: string | null = null;
  if (categoryType === "CHILD") {
    if (!parentId) {
      return { error: "Choose a parent category before creating a child category." };
    }
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) {
      return { error: "Parent category not found." };
    }
    resolvedParentId = parent.id;
  }

  const slug = await proposeCategorySlug(name, resolvedParentId);

  await prisma.category.create({
    data: {
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      parentId: resolvedParentId,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/", "layout");
  return {
    success:
      categoryType === "PRIMARY"
        ? `Added parent category “${name.trim()}” (${slug}).`
        : `Added child category “${name.trim()}” under selected parent (${slug}).`,
  };
}

const deleteSchema = z.object({ categoryId: z.string().min(1) });
const updateSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1, "Name is required.").max(120),
  description: z.string().max(500).optional(),
});

export async function updateCategory(_prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  void _prev;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const parsed = updateSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors.join(" ") || "Invalid input" };
  }

  const { categoryId, name, description } = parsed.data;

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: name.trim(),
      description: description?.trim() || null,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/", "layout");
  return { success: `Updated category “${name.trim()}”.` };
}

export async function deleteCategory(_prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  void _prev;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const parsed = deleteSchema.safeParse({ categoryId: formData.get("categoryId") });
  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  const { categoryId } = parsed.data;
  const subtreeIds = await collectSubtreeCategoryIds(categoryId);
  if (subtreeIds.length === 0) {
    return { error: "Category not found." };
  }

  const nodes = await prisma.category.findMany({
    where: { id: { in: subtreeIds } },
    select: { id: true, parentId: true },
  });
  if (nodes.length === 0) {
    return { error: "Category not found." };
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const depthMemo = new Map<string, number>();
  const depthOf = (id: string): number => {
    const seen = depthMemo.get(id);
    if (seen !== undefined) return seen;
    const node = byId.get(id);
    if (!node || !node.parentId || !byId.has(node.parentId)) {
      depthMemo.set(id, 1);
      return 1;
    }
    const d = depthOf(node.parentId) + 1;
    depthMemo.set(id, d);
    return d;
  };
  const orderedDeleteIds = [...subtreeIds].sort((a, b) => depthOf(b) - depthOf(a));

  await prisma.$transaction(async (tx) => {
    await tx.product.updateMany({
      where: { categoryId: { in: subtreeIds } },
      data: { categoryId: null },
    });
    for (const id of orderedDeleteIds) {
      await tx.category.delete({ where: { id } });
    }
  });

  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/", "layout");
  return {
    success:
      orderedDeleteIds.length > 1
        ? `Category subtree removed (${orderedDeleteIds.length} categories).`
        : "Category removed.",
  };
}
