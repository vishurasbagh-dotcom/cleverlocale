import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/money";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    orderBy: { name: "asc" },
    include: { vendor: true, category: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">All products</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Prices in INR (incl. storefront display from paise).</p>

      {products.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed p-8 text-center text-zinc-600 dark:text-zinc-400">
          No published products yet.
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
