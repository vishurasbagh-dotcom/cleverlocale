import Link from "next/link";
import { CANONICAL_CATEGORY_SLUGS } from "@/lib/catalog-categories";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/money";

type Props = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

const allowedCategorySlugs = new Set<string>(CANONICAL_CATEGORY_SLUGS);

export default async function ProductsPage({ searchParams }: Props) {
  const { q = "", category: rawCategory = "" } = await searchParams;
  const query = q.trim();
  const categorySlug = rawCategory && allowedCategorySlugs.has(rawCategory) ? rawCategory : "";

  const where = {
    isPublished: true,
    ...(categorySlug
      ? {
          category: { slug: categorySlug },
        }
      : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    include: { vendor: true, category: true },
  });

  const categoryLabel = categorySlug
    ? await prisma.category.findUnique({
        where: { slug: categorySlug },
        select: { name: true },
      })
    : null;

  const subtitleParts: string[] = [];
  if (categoryLabel?.name) subtitleParts.push(categoryLabel.name);
  if (query) subtitleParts.push(`“${query}”`);
  const filterSummary =
    subtitleParts.length > 0 ? `Filtered: ${subtitleParts.join(" · ")}` : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">All products</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Prices in INR (storefront reads from paise).
        {filterSummary ? (
          <>
            {" "}
            <span className="text-zinc-500 dark:text-zinc-500">{filterSummary}</span>
          </>
        ) : null}
      </p>

      {products.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          {filterSummary || query
            ? "No products match these filters. Try clearing the search or choosing All categories."
            : "No published products yet."}
        </p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/p/${p.vendor.slug}/${p.slug}`}
                className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4 hover:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <span className="text-xs text-zinc-500">{p.vendor.shopName}</span>
                <span className="font-medium">{p.name}</span>
                {p.category && <span className="text-sm text-zinc-500">{p.category.name}</span>}
                <span className="mt-2 text-emerald-800 dark:text-emerald-400">{formatInr(p.pricePaise)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
