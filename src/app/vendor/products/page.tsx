import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { productListPricePaise, productShowFromLabel } from "@/lib/product-display";
import { formatInr } from "@/lib/money";
import { vendorShopfrontLive } from "@/lib/vendor-shopfront-live";

export default async function VendorProductsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
  });

  if (!vendor) {
    return <p className="text-zinc-600 dark:text-zinc-400">No vendor profile for this account.</p>;
  }
  if (vendor.status !== "APPROVED") {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Products are available only after your vendor registration is approved.
      </p>
    );
  }
  if (!vendorShopfrontLive(vendor)) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Product management is paused while your shop is not live. Open your shop from the dashboard, or wait if CL Admin has
        temporarily closed it.
      </p>
    );
  }

  const products = await prisma.product.findMany({
    where: { vendorId: vendor.id },
    orderBy: { updatedAt: "desc" },
    include: { category: true, variants: true },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link
          href="/vendor/products/new"
          className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600"
        >
          Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-8 text-zinc-600 dark:text-zinc-400">No products yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {products.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-zinc-500">
                  {p.isPublished ? "Published" : "Draft"} · {p.category?.name ?? "Uncategorized"}
                </p>
              </div>
              <div className="text-right text-sm">
                <p>
                  {productShowFromLabel(p) ? <>From {formatInr(productListPricePaise(p))}</> : formatInr(productListPricePaise(p))}
                </p>
                <Link
                  href={`/p/${vendor.slug}/${p.slug}`}
                  className="text-emerald-800 hover:underline dark:text-emerald-400"
                >
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
