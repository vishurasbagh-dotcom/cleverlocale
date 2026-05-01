import { BackofficeShell } from "@/components/backoffice-shell";
import { signOut } from "@/auth";
import { redirect } from "next/navigation";

async function logoutAdmin() {
  "use server";
  await signOut({ redirect: false });
  redirect("/");
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <BackofficeShell
      appLabel="CL Admin"
      showBackToStorefront={false}
      appLabelAction={
        <form action={logoutAdmin}>
          <button
            type="submit"
            title="Log out and go to homepage"
            className="ml-2 inline-flex cursor-pointer items-center rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            Log out
          </button>
        </form>
      }
      mobileLinks={[
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/categories", label: "Categories" },
        { href: "/admin/vendors", label: "Vendors" },
        { href: "/admin/vendor-management", label: "Vendor mgmt" },
        { href: "/admin/orders", label: "Orders" },
      ]}
      sections={[
        {
          section: "Overview",
          items: [{ href: "/admin", label: "Dashboard", icon: "dash" }],
        },
        {
          section: "Catalog",
          items: [{ href: "/admin/categories", label: "Categories", icon: "tree" }],
        },
        {
          section: "Operations",
          items: [
            { href: "/admin/vendors", label: "Vendors", icon: "shop" },
            { href: "/admin/vendor-management", label: "Vendor management", icon: "star" },
            { href: "/admin/orders", label: "Orders", icon: "cart" },
            { href: "/admin/users", label: "Users", icon: "users", soon: true },
          ],
        },
        {
          section: "Platform",
          items: [{ href: "/admin/settings", label: "Settings", icon: "gear", soon: true }],
        },
      ]}
    >
      {children}
    </BackofficeShell>
  );
}
