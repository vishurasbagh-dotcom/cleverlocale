import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/money";

export default async function Home() {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    take: 6,
    orderBy: { updatedAt: "desc" },
    include: { vendor: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <section className="mb-12 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
          INR · Multi-vendor marketplace
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Cleverlocale</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Browse products from independent sellers. Cart and checkout use a dummy flow — no real payments.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/products"
            className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            Browse shop
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Create account
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Featured listings</h2>
        {products.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
            No products yet. Run{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-sm dark:bg-zinc-900">npx prisma migrate deploy</code>{" "}
            and{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-sm dark:bg-zinc-900">npm run db:seed</code>, then refresh.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/p/${p.vendor.slug}/${p.slug}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-800"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{p.vendor.shopName}</p>
                  <h3 className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">{p.name}</h3>
                  <p className="mt-2 text-lg font-medium text-emerald-800 dark:text-emerald-400">{formatInr(p.pricePaise)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
