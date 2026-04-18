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
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Platform overview (INR marketplace).</p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <dt className="text-sm text-zinc-500">Users</dt>
          <dd className="text-2xl font-semibold">{users}</dd>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <dt className="text-sm text-zinc-500">Vendors</dt>
          <dd className="text-2xl font-semibold">{vendors}</dd>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <dt className="text-sm text-zinc-500">Products</dt>
          <dd className="text-2xl font-semibold">{products}</dd>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <dt className="text-sm text-zinc-500">Orders</dt>
          <dd className="text-2xl font-semibold">{orders}</dd>
        </div>
      </dl>
    </div>
  );
}
