import { CANONICAL_CATEGORY_SLUGS } from "@/lib/catalog-categories";
import { prisma } from "@/lib/prisma";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { slug: { in: [...CANONICAL_CATEGORY_SLUGS] } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Categories</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        CL Admin only. Rows live in the Postgres table{" "}
        <code className="text-zinc-800 dark:text-zinc-200">categories</code> (visible in DBeaver). Cleverlocale uses{" "}
        <strong>exactly four</strong> fixed categories; extra rows are removed when you run{" "}
        <code className="text-zinc-800 dark:text-zinc-200">npm run db:seed</code>. New categories cannot be added from this panel.
      </p>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-zinc-500">Existing</h2>
        {categories.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">No categories yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {categories.map((c) => (
              <li key={c.id} className="flex flex-col gap-0.5 px-4 py-3">
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-zinc-500">/{c.slug}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
