import { auth } from "@/auth";
import { signOut } from "@/auth";
import { BackofficeShell } from "@/components/backoffice-shell";
import { prisma } from "@/lib/prisma";
import { vendorShopfrontLive } from "@/lib/vendor-shopfront-live";
import { redirect } from "next/navigation";

async function logoutVendor() {
  "use server";
  await signOut({ redirect: false });
  redirect("/");
}

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const vendor = session?.user?.id
    ? await prisma.vendor.findUnique({ where: { userId: session.user.id } })
    : null;
  const canManageProducts = Boolean(vendor && vendorShopfrontLive(vendor));

  return (
    <BackofficeShell
      appLabel="Vendor Admin"
      showBackToStorefront={false}
      appLabelAction={
        <form action={logoutVendor}>
          <button
            type="submit"
            title="Log out and go to homepage"
            className="ml-2 inline-flex cursor-pointer items-center rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            Log out
          </button>
        </form>
      }
      mobileLinks={
        canManageProducts
          ? [
              { href: "/vendor", label: "Dashboard" },
              { href: "/vendor/shop", label: "Shop" },
              { href: "/vendor/products", label: "Products" },
              { href: "/vendor/products/new", label: "New" },
            ]
          : vendor
            ? [
                { href: "/vendor", label: "Dashboard" },
                { href: "/vendor/shop", label: "Shop" },
              ]
            : [{ href: "/vendor", label: "Dashboard" }]
      }
      sections={[
        {
          section: "Overview",
          items: [
            { href: "/vendor", label: "Dashboard", icon: "dash" },
            ...(vendor ? [{ href: "/vendor/shop", label: "My Shop details", icon: "shop" as const }] : []),
          ],
        },
        ...(canManageProducts
          ? [
              {
                section: "Catalog",
                items: [
                  { href: "/vendor/products", label: "My products", icon: "box" as const },
                  { href: "/vendor/products/new", label: "New product", icon: "tree" as const },
                ],
              },
            ]
          : []),
      ]}
      notices={
        <>
          {vendor && vendor.status === "PENDING" && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Your vendor application is <strong>pending</strong>. You cannot publish until an admin approves your shop.
            </p>
          )}
          {vendor && vendor.status === "ON_HOLD" && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              Your application is <strong>on hold</strong>. Open <strong>My Shop details</strong> to update and submit again for review.
            </p>
          )}
          {vendor &&
            vendor.status === "APPROVED" &&
            !vendorShopfrontLive(vendor) && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100">
                {vendor.isAdminShopClosed ? (
                  <>
                    Your shop is <strong>temporarily closed by CL Admin</strong> and is hidden from the marketplace. Profile and
                    catalog editing are paused until the admin lifts this closure.
                  </>
                ) : (
                  <>
                    Your shop is <strong>closed</strong> on the marketplace. Open it from the dashboard when you’re ready to go
                    live again — profile and catalog editing are paused while closed.
                  </>
                )}
              </p>
            )}
          {vendor && vendor.status === "REJECTED" && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              This shop application was <strong>not approved</strong>. Contact Cleverlocale support if you have questions or need to reapply.
            </p>
          )}
          {session?.user?.role === "ADMIN" && (
            <p className="rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              You are viewing the vendor area as <strong>admin</strong>. Use a vendor account to manage listings end-to-end.
            </p>
          )}
        </>
      }
    >
      {children}
    </BackofficeShell>
  );
}
