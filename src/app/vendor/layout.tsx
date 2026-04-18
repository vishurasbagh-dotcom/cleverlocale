import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const vendor = session?.user?.id
    ? await prisma.vendor.findUnique({ where: { userId: session.user.id } })
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {vendor && vendor.status === "PENDING" && (
        <p className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Your vendor application is <strong>pending</strong>. You cannot publish until an admin approves your shop.
        </p>
      )}
      {session?.user?.role === "ADMIN" && (
        <p className="mb-6 rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          You are viewing the vendor area as <strong>admin</strong>. Use the seeded vendor account to manage listings end-to-end.
        </p>
      )}
      <div className="mb-6 flex flex-wrap gap-4 border-b border-zinc-200 pb-4 text-sm dark:border-zinc-800">
        <Link href="/vendor" className="font-medium hover:underline">
          Dashboard
        </Link>
        <Link href="/vendor/products" className="font-medium hover:underline">
          My products
        </Link>
        <Link href="/vendor/products/new" className="font-medium hover:underline">
          New product
        </Link>
        <Link href="/" className="ml-auto text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300">
          ← Storefront
        </Link>
      </div>
      {children}
    </div>
  );
}
