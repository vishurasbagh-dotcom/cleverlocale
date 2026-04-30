import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [users, vendors, products, orders] = await Promise.all([
    prisma.user.count(),
    prisma.vendor.count(),
    prisma.product.count(),
    prisma.order.count(),
  ]);

  return (
    <div>
      <header className="border-b border-zinc-200/80 pb-8 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Platform snapshot · INR marketplace</p>
      </header>

      <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <dt className="text-sm font-medium text-zinc-500">Users</dt>
          <dd className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{users}</dd>
        </div>
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <dt className="text-sm font-medium text-zinc-500">Vendors</dt>
          <dd className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{vendors}</dd>
        </div>
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <dt className="text-sm font-medium text-zinc-500">Products</dt>
          <dd className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{products}</dd>
        </div>
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <dt className="text-sm font-medium text-zinc-500">Orders</dt>
          <dd className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{orders}</dd>
        </div>
      </dl>
    </div>
  );
}
