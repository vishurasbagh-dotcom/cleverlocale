import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap gap-4 border-b border-zinc-200 pb-4 text-sm dark:border-zinc-800">
        <Link href="/admin" className="font-medium hover:underline">
          Overview
        </Link>
        <Link href="/admin/categories" className="font-medium hover:underline">
          Categories
        </Link>
        <Link href="/" className="ml-auto text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300">
          ← Storefront
        </Link>
      </div>
      {children}
    </div>
  );
}
