import Link from "next/link";
import { AddVendorModalButton } from "@/components/admin/add-vendor-modal-button";
import { AdminVendorShopToggle } from "@/components/admin/admin-vendor-shop-toggle";
import { AdminVendorStatusForm } from "@/components/admin/admin-vendor-status-form";
import { buildCategoryTree } from "@/lib/category-tree";
import { prisma } from "@/lib/prisma";
import { vendorShopfrontLive } from "@/lib/vendor-shopfront-live";

type Props = {
  searchParams: Promise<{
    status?: "PENDING" | "ON_HOLD" | "APPROVED" | "REJECTED" | "SUSPENDED";
    city?: string;
    q?: string;
  }>;
};

const STATUS_TABS = ["PENDING", "ON_HOLD", "APPROVED", "REJECTED", "SUSPENDED"] as const;

function statusLabel(status: (typeof STATUS_TABS)[number]) {
  if (status === "PENDING") return "Pending";
  if (status === "ON_HOLD") return "On hold";
  return status[0] + status.slice(1).toLowerCase();
}

function statusPill(status: (typeof STATUS_TABS)[number]) {
  return status === "APPROVED"
    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
    : status === "PENDING"
      ? "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100"
      : status === "ON_HOLD"
        ? "bg-orange-100 text-orange-950 dark:bg-orange-950/40 dark:text-orange-100"
        : status === "REJECTED"
          ? "bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-200"
          : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
}

export default async function AdminVendorsPage({ searchParams }: Props) {
  const params = await searchParams;
  const activeStatus = STATUS_TABS.includes((params.status ?? "PENDING") as (typeof STATUS_TABS)[number])
    ? (params.status as (typeof STATUS_TABS)[number])
    : "PENDING";
  const cityFilter = params.city?.trim() ?? "";
  const q = params.q?.trim() ?? "";

  const vendors = await prisma.vendor.findMany({
    where: {
      status: activeStatus,
      ...(cityFilter ? { city: { equals: cityFilter, mode: "insensitive" } } : {}),
      ...(q
        ? {
            OR: [
              { shopName: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
              { user: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      user: { select: { email: true, name: true } },
      sellingCategories: { include: { category: { select: { name: true } } } },
    },
  });

  const statusCounts = await prisma.vendor.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const countMap = new Map(statusCounts.map((r) => [r.status, r._count._all]));

  const cityRows = await prisma.vendor.findMany({
    where: { city: { not: null } },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  const cityOptions = cityRows.map((r) => r.city).filter((c): c is string => Boolean(c && c.trim()));
  const categoryRows = await prisma.category.findMany({
    select: { id: true, parentId: true, name: true, slug: true, description: true },
    orderBy: { name: "asc" },
  });
  const primaryCategories = buildCategoryTree(categoryRows).map((n) => ({ id: n.id, label: n.name }));

  return (
    <div>
      <header className="border-b border-zinc-200/80 pb-8 dark:border-zinc-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Operations</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Vendors</h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
              Review vendors by status first, then filter by city/search. Open details only when required for faster operations.
            </p>
          </div>
          <div className="self-start">
            <AddVendorModalButton primaryCategories={primaryCategories} />
          </div>
        </div>
      </header>

      <section className="mt-6 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <details className="mb-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-800 dark:text-zinc-100">Status guide</summary>
          <div className="mt-3 grid gap-2 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
            <p><strong>Pending</strong>: new vendor waiting for admin review.</p>
            <p><strong>On hold</strong>: paused; needs clarification or documents.</p>
            <p><strong>Approved</strong>: accepted and eligible to be publicly listed.</p>
            <p><strong>Rejected</strong>: not accepted in current review cycle.</p>
            <p className="sm:col-span-2"><strong>Suspended</strong>: blocked after approval due to policy/operations issues.</p>
          </div>
        </details>

        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((s) => (
            <Link
              key={s}
              href={`/admin/vendors?status=${s}${cityFilter ? `&city=${encodeURIComponent(cityFilter)}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                s === activeStatus
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {statusLabel(s)} ({countMap.get(s) ?? 0})
            </Link>
          ))}
        </div>
        <form className="mt-4 grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="status" defaultValue={activeStatus} />
          <label className="text-sm">
            <span className="mb-1 block text-zinc-500">City</span>
            <select
              name="city"
              defaultValue={cityFilter}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">All cities</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-zinc-500">Search</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Shop name, slug, or account email"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <div className="sm:col-span-3 flex gap-2">
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Apply filters
            </button>
            <Link href={`/admin/vendors?status=${activeStatus}`} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
              Clear
            </Link>
          </div>
        </form>
      </section>

      <div className="mt-6 space-y-4">
        {vendors.length === 0 ? (
          <p className="text-sm text-zinc-500">No vendors found for this filter.</p>
        ) : (
          vendors.map((v) => (
            <article
              key={v.id}
              className="relative rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              {v.status === "APPROVED" ? (
                <div className="absolute end-3 top-3 z-10 max-w-[min(100%-1.5rem,20rem)] sm:max-w-none">
                  <AdminVendorShopToggle vendorId={v.id} initialAdminClosed={v.isAdminShopClosed} />
                </div>
              ) : null}

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div
                  className={`min-w-0 ${v.status === "APPROVED" ? "pe-1 sm:pe-64" : ""}`}
                >
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{v.shopName}</h2>
                  <p className="mt-1 font-mono text-xs text-zinc-500">/{v.slug}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusPill(
                        v.status as (typeof STATUS_TABS)[number],
                      )}`}
                    >
                      {statusLabel(v.status as (typeof STATUS_TABS)[number])}
                    </span>
                    <span className="text-xs text-zinc-500">{v.city || "City missing"}</span>
                    {v.status === "APPROVED" && (
                      <span className="text-xs text-zinc-500">
                        {vendorShopfrontLive(v)
                          ? "Live on marketplace"
                          : v.isAdminShopClosed
                            ? "Hidden (admin closed)"
                            : !v.isShopOpen
                              ? "Hidden (vendor closed)"
                              : "Hidden"}
                      </span>
                    )}
                  </p>
                </div>
                <div
                  className={`flex shrink-0 flex-col items-end gap-2 ${v.status === "APPROVED" ? "pt-11 sm:pt-10" : ""}`}
                >
                  <AdminVendorStatusForm
                    vendorId={v.id}
                    defaultStatus={v.status as "PENDING" | "ON_HOLD" | "APPROVED" | "REJECTED" | "SUSPENDED"}
                    isApproved={v.status === "APPROVED"}
                    initialCorrectionNotes={v.correctionNotes}
                  />
                </div>
              </div>

              <details className="mt-3 rounded-lg border border-zinc-200/80 p-3 dark:border-zinc-800">
                <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-200">View details</summary>
                <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-zinc-500">Account</p>
                    <p className="mt-1 text-zinc-800 dark:text-zinc-200">
                      {v.user.email}
                      {v.user.name ? ` · ${v.user.name}` : ""}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-500">Address</p>
                    <p className="mt-1 text-zinc-800 dark:text-zinc-200">
                      {[v.addressLine1, v.addressLine2, v.locality, v.city, v.pincode].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-500">Selling categories</p>
                    <p className="mt-1 text-zinc-800 dark:text-zinc-200">
                      {v.sellingCategories.length === 0
                        ? "None recorded"
                        : v.sellingCategories.map((sc) => sc.category.name).join(", ")}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-500">Verification document</p>
                    {v.certificateStoredName ? (
                      <Link
                        href={`/api/admin/vendor-certificate/${v.id}`}
                        className="mt-1 inline-flex text-sm font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
                      >
                        Download — {v.certificateOriginalName ?? "uploaded file"}
                      </Link>
                    ) : (
                      <p className="mt-1 text-zinc-400">No file uploaded</p>
                    )}
                  </div>
                </div>
                {v.shopDescription ? (
                  <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                    {v.shopDescription}
                  </p>
                ) : null}
                {v.correctionNotes ? (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                    <strong>Current correction note:</strong> {v.correctionNotes}
                  </p>
                ) : null}
              </details>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
