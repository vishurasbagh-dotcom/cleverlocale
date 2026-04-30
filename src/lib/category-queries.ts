import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

/** Includes root and all descendants — used when filtering products by category on /products. */
export async function collectSubtreeCategoryIds(rootId: string): Promise<string[]> {
  const ids: string[] = [];
  const queue = [rootId];
  while (queue.length) {
    const id = queue.shift()!;
    ids.push(id);
    const children = await prisma.category.findMany({
      where: { parentId: id },
      select: { id: true },
    });
    for (const c of children) queue.push(c.id);
  }
  return ids;
}

export async function categoryHasChildren(categoryId: string): Promise<boolean> {
  const n = await prisma.category.count({ where: { parentId: categoryId } });
  return n > 0;
}

/** Products attach to leaves — categories with no subcategories. */
export async function categoryIsLeaf(categoryId: string): Promise<boolean> {
  return !(await categoryHasChildren(categoryId));
}

async function ensureUniqueCategorySlug(base: string): Promise<string> {
  let candidate = base;
  let n = 0;
  while (
    await prisma.category.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
  ) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}

/** Builds a readable slug; avoids collisions with `ensureUniqueCategorySlug`. */
export async function proposeCategorySlug(name: string, parentId: string | null): Promise<string> {
  const base = slugify(name);
  if (!parentId) {
    return ensureUniqueCategorySlug(base);
  }
  const parent = await prisma.category.findUnique({
    where: { id: parentId },
    select: { slug: true },
  });
  if (!parent) {
    return ensureUniqueCategorySlug(base);
  }
  const combined = `${parent.slug}--${base}`;
  return ensureUniqueCategorySlug(combined);
}
