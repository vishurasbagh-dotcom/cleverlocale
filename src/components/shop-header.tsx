import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import type { Session } from "next-auth";
import { HeaderCatalogSearch } from "@/components/header-catalog-search";
import { SignOutButton } from "@/components/sign-out-button";
import { buildCategoryTree, flattenPrimaryCategoryOptions } from "@/lib/category-tree";
import { prisma } from "@/lib/prisma";

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="9" cy="20" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.25" fill="currentColor" stroke="none" />
      <path d="M3 4h2l1 12h12l2-9H7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const getHeaderCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      select: { id: true, parentId: true, name: true, slug: true, description: true },
      orderBy: { name: "asc" },
    }),
  ["header-categories"],
  { revalidate: 300 },
);

export async function ShopHeader({ session }: { session: Session | null }) {
  const isAdmin = session?.user?.role === "ADMIN";
  const compact = session?.user?.role === "ADMIN" || session?.user?.role === "VENDOR";

  /** Distinct cart lines (products/SKUs), not sum of quantities. */
  let cartProductLineCount = 0;
  if (session?.user?.id && !isAdmin) {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      select: { _count: { select: { items: true } } },
    });
    cartProductLineCount = cart?._count.items ?? 0;
  }

  const rows = await getHeaderCategories();
  const categories = flattenPrimaryCategoryOptions(buildCategoryTree(rows));

  return (
    <header className="border-b border-[#141312] bg-[#181617]">
      {/* #181617 ≈ margin pixels in cleverlocale-logo.png. */}
      <div
        className={`flex w-full flex-col gap-3 px-4 py-3 sm:px-6 ${compact ? "sm:py-2 lg:flex-row lg:items-center lg:gap-3" : "sm:py-3 lg:flex-row lg:items-center lg:gap-4"}`}
      >
        <Link
          href="/"
          className={`inline-flex shrink-0 items-center self-start rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#febd69] lg:self-center ${compact ? "h-[60px] max-h-[60px]" : "h-[96px] max-h-[96px]"}`}
        >
          <Image
            src="/images/cleverlocale-logo.png"
            alt="Cleverlocale"
            width={1024}
            height={682}
            className={`w-auto object-contain object-left ${compact ? "h-[60px] max-w-[min(64vw,320px)]" : "h-[96px] max-w-[min(82vw,540px)]"}`}
            priority
            unoptimized
            sizes={compact ? "(max-width: 768px) 64vw, 320px" : "(max-width: 768px) 82vw, 540px"}
          />
          <span className="sr-only">Cleverlocale</span>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <Suspense
            fallback={
              <div className="h-11 w-full rounded-md bg-zinc-700/35" aria-hidden />
            }
          >
            <HeaderCatalogSearch categories={categories} />
          </Suspense>
        </div>

        <nav className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 text-sm font-medium text-zinc-200 sm:w-auto sm:justify-start sm:gap-3">
          {session ? (
            <>
              {!isAdmin && (
                <Link
                  href="/cart"
                  aria-label={
                    cartProductLineCount > 0
                      ? `Shopping cart, ${cartProductLineCount} product${cartProductLineCount === 1 ? "" : "s"}`
                      : "Shopping cart"
                  }
                  className={`relative inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition ${
                    cartProductLineCount > 0
                      ? "bg-[#febd69]/18 text-[#febd69] ring-1 ring-[#febd69]/55 hover:bg-[#febd69]/28 hover:text-white"
                      : "px-1 py-0.5 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <CartIcon
                    className={`h-5 w-5 shrink-0 ${cartProductLineCount > 0 ? "text-[#febd69]" : ""}`}
                  />
                  <span>Cart</span>
                  {cartProductLineCount > 0 ? (
                    <span className="absolute -right-1 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#febd69] px-1 text-[0.65rem] font-bold leading-none text-zinc-900 shadow-md tabular-nums ring-2 ring-[#181617]">
                      {cartProductLineCount > 99 ? "99+" : cartProductLineCount}
                    </span>
                  ) : null}
                </Link>
              )}
              {!isAdmin && (
                <Link href="/account/orders" className="rounded-md px-1 py-0.5 hover:bg-white/10 hover:text-white">
                  Orders
                </Link>
              )}
              {!isAdmin && (session.user.role === "VENDOR" || session.user.role === "ADMIN") && (
                <Link href="/vendor" className="rounded-md px-1 py-0.5 hover:bg-white/10 hover:text-white">
                  Vendor
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-sm bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  CL Admin Panel
                </Link>
              )}
              <span className="text-zinc-600">|</span>
              <span className="max-w-[10rem] truncate text-xs text-zinc-400" title={session.user.email ?? ""}>
                {session.user.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-sm border border-[#febd69]/80 bg-[#febd69]/10 px-3 py-2 text-center text-xs font-semibold leading-snug text-[#febd69] shadow-sm transition hover:border-[#febd69] hover:bg-[#febd69]/20 hover:text-white sm:whitespace-nowrap"
              >
                Sign in
              </Link>
              <Link
                href="/register/vendor"
                className="rounded-sm bg-[#febd69] px-3 py-2 text-center text-xs font-semibold leading-snug text-[#111] shadow hover:bg-[#f3a847] sm:whitespace-nowrap"
              >
                Register as a vendor
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
