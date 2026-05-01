import Link from "next/link";
import { AdminVendorFeaturedToggle } from "@/components/admin/admin-vendor-featured-toggle";
import { AdminVendorShopToggle } from "@/components/admin/admin-vendor-shop-toggle";
import { fetchApprovedVendorsForManagement } from "@/lib/vendor-featured-columns";
import { vendorShopfrontLive } from "@/lib/vendor-shopfront-live";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminVendorManagementPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const vendors = await fetchApprovedVendorsForManagement(q);

  return (
    <div>
      <header className="border-b border-zinc-200/80 pb-8 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Operations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Vendor management</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
          Approved shops only. Control admin closure (marketplace visibility), and feature highlighted shops on{" "}
          <strong>/shops</strong> and the homepage <strong>Featured listings</strong> section. Search matches shop name,
          slug, city, locality, address, pincode, phone, and description (database search, not Elasticsearch).
        </p>
      </header>

      <section className="mt-6">
        <form method="get" action="/admin/vendor-management" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1 text-sm">
            <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">Search vendors</span>
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Name, city, locality, address, pincode…"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              autoComplete="off"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Search
            </button>
            {q ? (
              <Link
                href="/admin/vendor-management"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="mt-8">
        {vendors.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {q?.trim() ? "No approved vendors match your search." : "No approved vendors yet. Approve applications under Vendors."}
          </p>
        ) : (
          <ul className="space-y-4">
            {vendors.map((v) => (
              <li
                key={v.id}
                className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{v.shopName}</h2>
                    <p className="mt-2 text-xs text-zinc-500">
                      {v.city || "City not set"} ·{" "}
                      {vendorShopfrontLive(v)
                        ? "Live on marketplace"
                        : v.isAdminShopClosed
                          ? "Hidden (admin closed)"
                          : !v.isShopOpen
                            ? "Hidden (vendor closed)"
                            : "Hidden"}
                    </p>
                    <p className="mt-3">
                      <Link
                        href={`/admin/vendor-management/${v.id}/products`}
                        className="inline-flex rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        View products
                      </Link>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    <AdminVendorShopToggle vendorId={v.id} initialAdminClosed={v.isAdminShopClosed} />
                    <AdminVendorFeaturedToggle vendorId={v.id} initialFeatured={v.isFeatured} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
