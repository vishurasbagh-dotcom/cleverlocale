"use client";

import { usePathname } from "next/navigation";
import { CatalogSearch, type CatalogSearchCategory } from "@/components/catalog-search";

/**
 * Hides catalog search on auth-focused routes so the bar stays minimal (e.g. login).
 */
export function HeaderCatalogSearch({ categories }: { categories: CatalogSearchCategory[] }) {
  const pathname = usePathname();
  if (pathname === "/login") {
    return null;
  }
  return <CatalogSearch categories={categories} />;
}
