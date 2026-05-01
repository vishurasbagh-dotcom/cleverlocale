import Link from "next/link";
import { FeaturedBadge } from "@/components/featured-badge";
import { getMarketplaceVendorWhere, storefrontVendorSelect } from "@/lib/marketplace-vendor";
import { prisma } from "@/lib/prisma";
import { loadFeaturedFlagsByVendorId } from "@/lib/vendor-featured-columns";
import { productListPricePaise, productShowFromLabel } from "@/lib/product-display";
import { formatInr } from "@/lib/money";

const HOMEPAGE_FEATURED_COUNT = 6;

export default async function Home() {
  const marketplaceVendor = await getMarketplaceVendorWhere();
  const featuredVendors = await prisma.vendor.findMany({
    where: { ...marketplaceVendor, isFeatured: true },
    select: { id: true },
  });
  const featuredVendorIds = featuredVendors.map((v) => v.id);

  const includeProduct = { vendor: { select: storefrontVendorSelect }, variants: true } as const;

  const fromFeatured =
    featuredVendorIds.length > 0
      ? await prisma.product.findMany({
          where: {
            isPublished: true,
            vendorId: { in: featuredVendorIds },
            vendor: marketplaceVendor,
          },
          take: HOMEPAGE_FEATURED_COUNT,
          orderBy: { updatedAt: "desc" },
          include: includeProduct,
        })
      : [];

  const needMore = HOMEPAGE_FEATURED_COUNT - fromFeatured.length;
  const excludeIds = fromFeatured.map((p) => p.id);
  const fromOthers =
    needMore > 0
      ? await prisma.product.findMany({
          where: {
            isPublished: true,
            vendor: marketplaceVendor,
            ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
          },
          take: needMore,
          orderBy: { updatedAt: "desc" },
          include: includeProduct,
        })
      : [];

  const productRows = [...fromFeatured, ...fromOthers];
  const featuredMap = await loadFeaturedFlagsByVendorId(productRows.map((p) => p.vendor.id));
  const products = productRows.map((p) => ({
    ...p,
    vendor: { ...p.vendor, isFeatured: featuredMap.get(p.vendor.id) ?? false },
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Cleverlocale</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          We help local retailers run their own storefront on one shared marketplace—so shoppers can discover shops, browse
          products in INR, and support sellers in their community.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/shops"
            className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            Browse shops
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Featured listings</h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Slots are filled from CL Admin–featured shops first (most recently updated listings), then from other live sellers.
        </p>
        {products.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
            No featured listings yet. Check back soon.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/p/${p.vendor.slug}/${p.slug}`}
                  className={`block rounded-xl border bg-white p-4 shadow-sm transition hover:shadow dark:bg-zinc-950 ${
                    p.vendor.isFeatured
                      ? "border-amber-200/90 ring-1 ring-amber-100 hover:border-amber-300 dark:border-amber-800/60 dark:ring-amber-950/50 dark:hover:border-amber-700"
                      : "border-zinc-200 hover:border-emerald-300 dark:border-zinc-800 dark:hover:border-emerald-800"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{p.vendor.shopName}</p>
                    {p.vendor.isFeatured ? <FeaturedBadge className="normal-case" /> : null}
                  </div>
                  <h3 className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">{p.name}</h3>
                  <p className="mt-2 text-lg font-medium text-emerald-800 dark:text-emerald-400">
                    {productShowFromLabel(p) ? <>From {formatInr(productListPricePaise(p))}</> : formatInr(productListPricePaise(p))}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
