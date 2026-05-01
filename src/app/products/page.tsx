import Image from "next/image";
import Link from "next/link";
import { collectSubtreeCategoryIds } from "@/lib/category-queries";
import { getMarketplaceVendorWhere, storefrontVendorSelect } from "@/lib/marketplace-vendor";
import { prisma } from "@/lib/prisma";
import { productListPricePaise, productShowFromLabel } from "@/lib/product-display";
import { formatInr } from "@/lib/money";

type Props = {
  searchParams: Promise<{ q?: string; category?: string; vendor?: string }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const { q = "", category: rawCategory = "", vendor: rawVendor = "" } = await searchParams;
  const query = q.trim();
  const requestedSlug = rawCategory.trim();
  const vendorSlug = rawVendor.trim();

  const rootCategory = requestedSlug
    ? await prisma.category.findUnique({
        where: { slug: requestedSlug },
        select: { id: true, name: true },
      })
    : null;

  const categoryIds =
    rootCategory && requestedSlug ? await collectSubtreeCategoryIds(rootCategory.id) : null;

  const marketplaceVendor = await getMarketplaceVendorWhere();
  const vendorShop = vendorSlug
    ? await prisma.vendor.findFirst({
        where: { slug: vendorSlug, ...marketplaceVendor },
        select: { id: true, shopName: true, slug: true },
      })
    : null;
  const vendorFilterBroken = Boolean(vendorSlug && !vendorShop);

  const where = {
    isPublished: true,
    vendor: marketplaceVendor,
    ...(vendorShop ? { vendorId: vendorShop.id } : {}),
    ...(vendorFilterBroken ? { id: { in: [] } } : {}),
    ...(categoryIds
      ? {
          categoryId: { in: categoryIds },
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
    include: {
      vendor: { select: storefrontVendorSelect },
      category: true,
      variants: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { storedName: true } },
    },
  });

  const subtitleParts: string[] = [];
  if (vendorShop) subtitleParts.push(vendorShop.shopName);
  if (rootCategory?.name) subtitleParts.push(rootCategory.name);
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
          {vendorFilterBroken
            ? "That shop was not found or is not live on the marketplace."
            : filterSummary || query
              ? "No products match these filters. Try clearing the search or choosing All categories."
              : "No published products yet."}
        </p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/p/${p.vendor.slug}/${p.slug}`}
                className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-3 hover:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-950 sm:gap-4 sm:p-4"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 sm:h-[4.5rem] sm:w-[4.5rem]">
                  {p.images[0] ? (
                    <Image
                      src={`/api/product-image/${p.id}/${p.images[0].storedName}`}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="72px"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[0.65rem] font-medium text-zinc-400 dark:text-zinc-600">
                      No image
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-xs text-zinc-500">{p.vendor.shopName}</span>
                  <span className="font-medium leading-snug">{p.name}</span>
                  {p.category && <span className="text-sm text-zinc-500">{p.category.name}</span>}
                  <span className="mt-auto pt-2 text-emerald-800 dark:text-emerald-400">
                    {productShowFromLabel(p) ? <>From {formatInr(productListPricePaise(p))}</> : formatInr(productListPricePaise(p))}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
