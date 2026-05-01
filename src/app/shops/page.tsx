import Link from "next/link";
import { FeaturedBadge } from "@/components/featured-badge";
import { getMarketplaceVendorWhere } from "@/lib/marketplace-vendor";
import { prisma } from "@/lib/prisma";
import { loadFeaturedFlagsByVendorId } from "@/lib/vendor-featured-columns";

export default async function ShopsPage() {
  const rows = await prisma.vendor.findMany({
    where: await getMarketplaceVendorWhere(),
    orderBy: { shopName: "asc" },
    select: {
      id: true,
      slug: true,
      shopName: true,
      shopDescription: true,
      shopLocation: { select: { city: true, locality: true } },
    },
  });
  const featuredMap = await loadFeaturedFlagsByVendorId(rows.map((v) => v.id));
  const vendors = rows
    .map((v) => ({ ...v, isFeatured: featuredMap.get(v.id) ?? false }))
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Shops on Cleverlocale</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Browse retailers who are live on the marketplace. Featured shops appear first. Open a shop to see their products.
      </p>

      {vendors.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          No shops are live yet. Check back soon.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {vendors.map((v) => (
            <li key={v.slug}>
              <Link
                href={`/products?vendor=${encodeURIComponent(v.slug)}`}
                className={`flex h-full flex-col rounded-xl border bg-white p-5 shadow-sm transition hover:shadow dark:bg-zinc-950 ${
                  v.isFeatured
                    ? "border-amber-300/90 ring-1 ring-amber-200/80 hover:border-amber-400 dark:border-amber-700/50 dark:ring-amber-900/40 dark:hover:border-amber-600"
                    : "border-zinc-200 hover:border-emerald-400 dark:border-zinc-800 dark:hover:border-emerald-700"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{v.shopName}</span>
                  {v.isFeatured ? <FeaturedBadge /> : null}
                </div>
                {(v.shopLocation?.city || v.shopLocation?.locality) && (
                  <span className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {[v.shopLocation?.locality, v.shopLocation?.city].filter(Boolean).join(", ")}
                  </span>
                )}
                {v.shopDescription ? (
                  <p className="mt-3 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{v.shopDescription}</p>
                ) : null}
                <span className="mt-4 text-sm font-medium text-emerald-800 dark:text-emerald-400">View products →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
