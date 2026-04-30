import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import type { Session } from "next-auth";
import { HeaderCatalogSearch } from "@/components/header-catalog-search";
import { SignOutButton } from "@/components/sign-out-button";
import { buildCategoryTree, flattenCategoryOptions } from "@/lib/category-tree";
import { prisma } from "@/lib/prisma";

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
  const showVendorApply =
    session?.user?.role === "CUSTOMER" &&
    !(await prisma.vendor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    }));
  const rows = await getHeaderCategories();
  const categories = flattenCategoryOptions(buildCategoryTree(rows));

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

        <div className="flex min-w-0 flex-1 flex-col justify-center lg:max-w-none">
          <Suspense
            fallback={
              <div
                className="h-11 w-full max-w-3xl rounded-md bg-zinc-700/35"
                aria-hidden
              />
            }
          >
            <HeaderCatalogSearch categories={categories} />
          </Suspense>
        </div>

        <nav className="flex w-full shrink-0 flex-wrap items-center justify-end gap-3 text-sm font-medium text-zinc-100 sm:w-auto sm:justify-start">
          {session ? (
            <>
              {!isAdmin && (
                <Link href="/cart" className="hover:text-white">
                  Cart
                </Link>
              )}
              {!isAdmin && (
                <Link href="/account/orders" className="hover:text-white">
                  Orders
                </Link>
              )}
              {!isAdmin && (session.user.role === "VENDOR" || session.user.role === "ADMIN") && (
                <Link href="/vendor" className="hover:text-white">
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
              {!isAdmin && showVendorApply && (
                <Link
                  href="/register/vendor"
                  className="rounded-sm bg-[#febd69] px-2.5 py-1.5 text-xs font-semibold text-[#111] hover:bg-[#f3a847]"
                >
                  Apply as vendor
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
              <Link href="/login" className="hover:text-white">
                Log in
              </Link>
              <Link
                href="/register/vendor"
                className="rounded-sm bg-[#febd69] px-3 py-2 text-center text-xs font-semibold leading-snug text-[#111] shadow hover:bg-[#f3a847] sm:max-w-none sm:whitespace-nowrap"
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
