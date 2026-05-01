import Link from "next/link";
import { auth } from "@/auth";
import { VendorShopOpenToggle } from "@/components/vendor-shop-open-toggle";
import { prisma } from "@/lib/prisma";
import { vendorShopfrontLive } from "@/lib/vendor-shopfront-live";

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
          Sign in as a vendor user (e.g. seed <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">mumbai-masala-mart@cleverlocale.local</code>) to
          manage listings.
        </p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Vendor dashboard</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          No vendor profile is linked to this account yet.{" "}
          <a href="/register/vendor" className="font-medium text-emerald-800 underline dark:text-emerald-400">
            Register as a vendor
          </a>
        </p>
      </div>
    );
  }

  const registrationLabel =
    vendor.status === "APPROVED"
      ? "Approved"
      : vendor.status === "REJECTED"
        ? "Rejected"
        : vendor.status === "ON_HOLD"
          ? "On hold"
          : vendor.status === "SUSPENDED"
            ? "Suspended"
            : "Pending review";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{vendor.shopName}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Registration: <strong>{registrationLabel}</strong>
        </p>
        {vendor.status === "APPROVED" && vendorShopfrontLive(vendor) && (
          <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
            Your shop is <strong>live</strong> on the marketplace (visible to shoppers when your products are published).
          </p>
        )}
        <p className="mt-6 text-zinc-700 dark:text-zinc-300">
          You have <strong>{vendor._count.products}</strong> product{vendor._count.products === 1 ? "" : "s"}.
        </p>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          View your shop profile and submit admin-requested updates in{" "}
          <Link href="/vendor/shop" className="font-medium text-emerald-800 underline dark:text-emerald-400">
            My Shop details
          </Link>
          .
        </p>
      </div>

      {vendor.status === "APPROVED" && (
        <VendorShopOpenToggle
          initialOpen={vendor.isShopOpen}
          disabled={false}
          adminFrozen={vendor.isAdminShopClosed}
        />
      )}
    </div>
  );
}
