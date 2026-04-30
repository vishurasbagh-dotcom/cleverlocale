"use client";

import { usePathname, useSearchParams } from "next/navigation";

export type CatalogSearchCategory = { slug: string; label: string };

type CatalogSearchProps = {
  categories: CatalogSearchCategory[];
  /** Fixed width hint for the bar (Tailwind classes) */
  className?: string;
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.2-4.2" />
    </svg>
  );
}

/**
 * Amazon-style catalog search: category dropdown + query + submit to /products (GET).
 * On `/` the form defaults to All + empty query. On `/products`, values sync from the URL.
 */
export function CatalogSearch({ categories, className = "" }: CatalogSearchProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onProducts = pathname === "/products";
  const q = onProducts ? (searchParams.get("q") ?? "") : "";
  const categorySlug = onProducts ? (searchParams.get("category") ?? "") : "";

  return (
    <form
      action="/products"
      method="get"
      className={`flex h-11 w-full min-w-0 max-w-3xl overflow-hidden rounded-md border border-zinc-400 bg-white shadow-sm outline-none focus-within:ring-2 focus-within:ring-[#febd69]/70 ${className}`}
      role="search"
    >
      <label htmlFor="catalog-category" className="sr-only">
        Category
      </label>
      <select
        id="catalog-category"
        name="category"
        defaultValue={categorySlug}
        key={`catalog-category-${pathname}-${categorySlug}`}
        className="min-w-0 max-w-[min(50%,14rem)] shrink cursor-pointer border-0 bg-[#f3f3f3] px-2 py-2 text-xs text-[#111] outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none sm:max-w-[12.5rem] sm:px-3 sm:text-sm"
      >
        <option value="">All</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.label}
          </option>
        ))}
      </select>
      <label htmlFor="catalog-query" className="sr-only">
        Search
      </label>
      <input
        id="catalog-query"
        name="q"
        type="search"
        placeholder="Search Cleverlocale"
        defaultValue={q}
        key={`catalog-query-${pathname}-${q}`}
        autoComplete="off"
        className="min-w-0 flex-1 border-0 border-l border-[#ddd] px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-0"
      />
      <button
        type="submit"
        aria-label="Search"
        className="flex shrink-0 items-center justify-center bg-[#febd69] px-4 text-zinc-900 outline-none ring-0 transition hover:bg-[#f3a847] focus:outline-none focus:ring-0 active:bg-[#ec9c3a]"
      >
        <SearchIcon className="h-6 w-6" />
      </button>
    </form>
  );
}
