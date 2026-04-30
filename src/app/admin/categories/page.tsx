import { AdminCategoriesClientV2 } from "@/components/admin/admin-categories-client-v2";
import { buildCategoryTree } from "@/lib/category-tree";
import { prisma } from "@/lib/prisma";

export default async function AdminCategoriesPage() {
  const rows = await prisma.category.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      parentId: true,
      name: true,
      slug: true,
      description: true,
      _count: { select: { products: true } },
    },
  });

  const tree = buildCategoryTree(rows);
  const productCountById = Object.fromEntries(rows.map((r) => [r.id, r._count.products]));

  return (
    <div>
      <header className="border-b border-zinc-200/80 pb-8 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Catalog</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Product categories
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Organize the storefront into aisles and shelves. Use top-level categories for broad departments (e.g. Groceries,
          Electronics) and add subcategories for how vendors list products (e.g. Cereals and Pulses, Mobiles).
        </p>
      </header>

      <div className="mt-10">
        <AdminCategoriesClientV2 tree={tree} productCountById={productCountById} />
      </div>
    </div>
  );
}
