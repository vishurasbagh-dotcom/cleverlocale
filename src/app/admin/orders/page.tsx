import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/money";

type Props = {
  searchParams: Promise<{
    vendor?: string;
    category?: string;
  }>;
};

function toDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function labelDay(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { vendor: vendorFilter = "", category: categoryFilter = "" } = await searchParams;

  const [orders] = await Promise.all([
    prisma.order.findMany({
      where: { status: "CONFIRMED" },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true } },
        lines: {
          include: {
            vendor: { select: { id: true, shopName: true, slug: true } },
            product: { select: { category: { select: { id: true, name: true, slug: true } } } },
          },
        },
      },
      take: 500,
    }),
  ]);

  const vendorStats = new Map<string, { shopName: string; slug: string; orderCount: number; revenuePaise: number }>();
  const categoryStats = new Map<string, { name: string; slug: string; orderCount: number; revenuePaise: number }>();

  const now = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (13 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const ordersByDay = new Map<string, number>(days.map((d) => [toDayKey(d), 0]));

  const filteredOrders = orders.filter((o) => {
    const hasVendor =
      !vendorFilter ||
      o.lines.some((l) => l.vendor.slug === vendorFilter || l.vendor.id === vendorFilter);
    const hasCategory =
      !categoryFilter ||
      o.lines.some(
        (l) => l.product.category && (l.product.category.slug === categoryFilter || l.product.category.id === categoryFilter),
      );
    return hasVendor && hasCategory;
  });

  for (const o of orders) {
    const day = toDayKey(o.createdAt);
    if (ordersByDay.has(day)) {
      ordersByDay.set(day, (ordersByDay.get(day) ?? 0) + 1);
    }

    const seenVendors = new Set<string>();
    const seenCategories = new Set<string>();
    for (const line of o.lines) {
      const v = line.vendor;
      if (!vendorStats.has(v.id)) {
        vendorStats.set(v.id, {
          shopName: v.shopName,
          slug: v.slug,
          orderCount: 0,
          revenuePaise: 0,
        });
      }
      const vs = vendorStats.get(v.id)!;
      vs.revenuePaise += line.lineTotalPaise;
      if (!seenVendors.has(v.id)) {
        vs.orderCount += 1;
        seenVendors.add(v.id);
      }

      const cat = line.product.category;
      if (cat) {
        if (!categoryStats.has(cat.id)) {
          categoryStats.set(cat.id, { name: cat.name, slug: cat.slug, orderCount: 0, revenuePaise: 0 });
        }
        const cs = categoryStats.get(cat.id)!;
        cs.revenuePaise += line.lineTotalPaise;
        if (!seenCategories.has(cat.id)) {
          cs.orderCount += 1;
          seenCategories.add(cat.id);
        }
      }
    }
  }

  const totalOrders = filteredOrders.length;
  const totalRevenuePaise = filteredOrders.reduce((sum, o) => sum + o.totalPaise, 0);

  const vendorRows = [...vendorStats.values()].sort((a, b) => b.orderCount - a.orderCount);
  const categoryRows = [...categoryStats.values()].sort((a, b) => b.orderCount - a.orderCount);

  const graphPoints = days.map((d) => ({
    key: toDayKey(d),
    label: labelDay(d),
    count: ordersByDay.get(toDayKey(d)) ?? 0,
  }));
  const graphMax = Math.max(1, ...graphPoints.map((p) => p.count));

  return (
    <div>
      <header className="border-b border-zinc-200/80 pb-8 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Operations
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Orders Intelligence
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
          Consolidated Cleverlocale order view across all vendors. Drill down by vendor and category using filters below.
        </p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Total orders</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{totalOrders}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Gross value</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{formatInr(totalRevenuePaise)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Avg order value</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {totalOrders > 0 ? formatInr(Math.round(totalRevenuePaise / totalOrders)) : formatInr(0)}
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Drill-down:</span>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500 dark:border-zinc-700">
              Vendor: {vendorFilter || "All"}
            </span>
            <span className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500 dark:border-zinc-700">
              Category: {categoryFilter || "All"}
            </span>
          </div>
          {(vendorFilter || categoryFilter) && (
            <Link href="/admin/orders" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
              Clear filters
            </Link>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Order Trend (Last 14 Days)</h2>
        <div className="mt-4 grid grid-cols-14 items-end gap-2">
          {graphPoints.map((p) => {
            const h = `${Math.max(8, Math.round((p.count / graphMax) * 140))}px`;
            return (
              <div key={p.key} className="flex flex-col items-center gap-1">
                <div title={`${p.label}: ${p.count} orders`} className="w-full rounded-sm bg-emerald-500/80" style={{ height: h }} />
                <span className="text-[10px] text-zinc-500">{p.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-base font-semibold">Vendor-level Consolidation</h3>
          <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
            {vendorRows.length === 0 ? (
              <li className="py-3 text-sm text-zinc-500">No vendor data yet.</li>
            ) : (
              vendorRows.map((v) => (
                <li key={v.slug} className="flex items-center justify-between py-3 text-sm">
                  <Link href={`/admin/orders?vendor=${encodeURIComponent(v.slug)}`} className="font-medium hover:underline">
                    {v.shopName}
                  </Link>
                  <span className="text-zinc-500">
                    {v.orderCount} orders · {formatInr(v.revenuePaise)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-base font-semibold">Category-level Consolidation</h3>
          <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
            {categoryRows.length === 0 ? (
              <li className="py-3 text-sm text-zinc-500">No category data yet.</li>
            ) : (
              categoryRows.map((c) => (
                <li key={c.slug} className="flex items-center justify-between py-3 text-sm">
                  <Link href={`/admin/orders?category=${encodeURIComponent(c.slug)}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                  <span className="text-zinc-500">
                    {c.orderCount} orders · {formatInr(c.revenuePaise)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold">Recent Orders (Filtered)</h3>
        <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {filteredOrders.length === 0 ? (
            <li className="py-3 text-sm text-zinc-500">No orders for this filter.</li>
          ) : (
            filteredOrders.slice(0, 50).map((o) => (
              <li key={o.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{o.createdAt.toLocaleString("en-IN")}</span>
                  <span className="text-zinc-500">
                    {o.lines.length} line(s) · {formatInr(o.totalPaise)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Buyer: {o.user.email} · Vendors: {[...new Set(o.lines.map((l) => l.vendor.shopName))].join(", ")}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
