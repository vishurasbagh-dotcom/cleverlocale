import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function VendorDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    include: { _count: { select: { products: true } } },
  });

  if (session.user.role === "ADMIN" && !vendor) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Vendor dashboard</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Sign in as a vendor user (e.g. seed <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">vendor@cleverlocale.local</code>) to
          manage listings.
        </p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Vendor dashboard</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">No vendor profile is linked to this account yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">{vendor.shopName}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Status: <strong>{vendor.status}</strong> · Slug: <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">{vendor.slug}</code>
      </p>
      <p className="mt-6 text-zinc-700 dark:text-zinc-300">
        You have <strong>{vendor._count.products}</strong> product{vendor._count.products === 1 ? "" : "s"}.
      </p>
    </div>
  );
}
