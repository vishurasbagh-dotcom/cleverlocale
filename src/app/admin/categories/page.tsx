import { prisma } from "@/lib/prisma";
import { CategoryCreateForm } from "@/components/category-create-form";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Categories</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Used to classify products across vendors.</p>

      <section className="mt-8 max-w-xl">
        <h2 className="text-sm font-medium text-zinc-500">Add category</h2>
        <CategoryCreateForm />
      </section>

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
