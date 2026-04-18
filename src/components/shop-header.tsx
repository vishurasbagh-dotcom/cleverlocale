import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";

export async function ShopHeader() {
  const session = await auth();

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight text-emerald-800 dark:text-emerald-400">
          Cleverlocale
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Link href="/products" className="hover:text-zinc-950 dark:hover:text-white">
            Shop
          </Link>
          {session ? (
            <>
              <Link href="/cart" className="hover:text-zinc-950 dark:hover:text-white">
                Cart
              </Link>
              <Link href="/account/orders" className="hover:text-zinc-950 dark:hover:text-white">
                Orders
              </Link>
              {(session.user.role === "VENDOR" || session.user.role === "ADMIN") && (
                <Link href="/vendor" className="hover:text-zinc-950 dark:hover:text-white">
                  Vendor
                </Link>
              )}
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="hover:text-zinc-950 dark:hover:text-white">
                  Admin
                </Link>
              )}
              <span className="text-zinc-400">|</span>
              <span className="max-w-[10rem] truncate text-xs text-zinc-500" title={session.user.email ?? ""}>
                {session.user.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-zinc-950 dark:hover:text-white">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-emerald-700 px-3 py-1.5 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
