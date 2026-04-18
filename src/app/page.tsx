import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="flex max-w-lg flex-col items-center gap-6 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
          INR · Multi-vendor marketplace
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">Cleverlocale</h1>
        <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Customer storefront, vendor panel, and admin — coming next. Stack: Next.js,
          Prisma, PostgreSQL.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Next.js docs
          </Link>
          <Link
            className="rounded-full border border-zinc-300 px-5 py-2.5 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            href="https://www.prisma.io/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Prisma docs
          </Link>
        </div>
      </main>
    </div>
  );
}
