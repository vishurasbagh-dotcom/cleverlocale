import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { HeaderCatalogSearch } from "@/components/header-catalog-search";
import { SignOutButton } from "@/components/sign-out-button";
import { CANONICAL_CATEGORY_SLUGS } from "@/lib/catalog-categories";
import { prisma } from "@/lib/prisma";

export async function ShopHeader() {
  const session = await auth();
  const categories = await prisma.category.findMany({
    where: { slug: { in: [...CANONICAL_CATEGORY_SLUGS] } },
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <header className="border-b border-[#141312] bg-[#181617]">
      {/* #181617 ≈ margin pixels in cleverlocale-logo.png. */}
      <div className="flex w-full flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-6 lg:flex-row lg:items-center lg:gap-6">
        <Link
          href="/"
          className="inline-flex h-[200px] max-h-[200px] shrink-0 items-center self-start rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#febd69] lg:self-center"
        >
          <Image
            src="/images/cleverlocale-logo.png"
            alt="Cleverlocale"
            width={1024}
            height={682}
            className="h-[200px] w-auto max-w-[min(96vw,1100px)] object-contain object-left"
            priority
            unoptimized
            sizes="(max-width: 768px) 96vw, 1100px"
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
              <Link href="/cart" className="hover:text-white">
                Cart
              </Link>
              <Link href="/account/orders" className="hover:text-white">
                Orders
              </Link>
              {(session.user.role === "VENDOR" || session.user.role === "ADMIN") && (
                <Link href="/vendor" className="hover:text-white">
                  Vendor
                </Link>
              )}
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="hover:text-white">
                  Admin
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
                href="/register"
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
