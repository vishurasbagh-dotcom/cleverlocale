/** Small storefront marker for CL Admin–featured shops / their products. */
export function FeaturedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 ${className}`}
    >
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 17.8 5.7 21l2.3-7-6-4.6h7.6L12 2z" />
      </svg>
      Featured
    </span>
  );
}
