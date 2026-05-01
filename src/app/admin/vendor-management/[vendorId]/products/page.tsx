import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/money";

type Props = { params: Promise<{ vendorId: string }> };

export default async function AdminVendorProductsPage({ params }: Props) {
  const { vendorId } = await params;

  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, status: "APPROVED" },
    select: { id: true, shopName: true, slug: true, shopLocation: { select: { city: true } } },
  });
  if (!vendor) notFound();

  const products = await prisma.product.findMany({
    where: { vendorId: vendor.id },
    orderBy: [{ isPublished: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      isPublished: true,
      stock: true,
      pricePaise: true,
      category: { select: { name: true } },
    },
  });

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
        <Link href="/admin/vendor-management" className="hover:underline">
          Vendor management
        </Link>
        <span className="font-normal text-zinc-500"> · Products</span>
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{vendor.shopName}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {vendor.shopLocation?.city ? `${vendor.shopLocation.city} · ` : null}
        {products.length} product{products.length === 1 ? "" : "s"}
      </p>

      {products.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">This vendor has no products yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
          {products.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{p.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {p.category?.name ?? "Uncategorised"} · {p.isPublished ? "Published" : "Draft"} · Stock {p.stock} ·{" "}
                  {formatInr(p.pricePaise)}
                </p>
              </div>
              <Link
                href={`/p/${vendor.slug}/${p.slug}`}
                className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                View on storefront
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
