"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleAdminVendorFeatured } from "@/actions/admin-vendors";

export function AdminVendorFeaturedToggle({
  vendorId,
  initialFeatured,
}: {
  vendorId: string;
  initialFeatured: boolean;
}) {
  const router = useRouter();
  const [featured, setFeatured] = useOptimistic(initialFeatured, (_c, next: boolean) => next);
  const [pending, startTransition] = useTransition();

  function flip() {
    if (pending) return;
    const next = !featured;
    const previous = featured;
    startTransition(async () => {
      setFeatured(next);
      const res = await toggleAdminVendorFeatured(vendorId);
      if (res.ok) {
        setFeatured(res.isFeatured);
        router.refresh();
        return;
      }
      setFeatured(previous);
    });
  }

  const label = featured ? "Featured on storefront" : "Not featured";
  const hint = featured
    ? "Shop and products are highlighted. Click to remove featured placement."
    : "Click to feature this shop on /shops and prioritize its products on the homepage.";

  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-zinc-200/90 bg-white px-3 py-2 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/80"
      title={hint}
    >
      <div className="min-w-0 flex-1 text-end">
        <p
          className={`text-xs font-semibold leading-snug tracking-tight ${
            featured ? "text-amber-700 dark:text-amber-300" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {label}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={featured}
        aria-label={`${label}. ${hint}`}
        disabled={pending}
        onClick={flip}
        className={`relative inline-flex h-7 w-[2.875rem] shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-zinc-900 ${
          featured
            ? "bg-gradient-to-b from-amber-400 to-amber-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] dark:from-amber-500 dark:to-amber-700"
            : "bg-gradient-to-b from-zinc-400 to-zinc-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] dark:from-zinc-600 dark:to-zinc-700"
        }`}
      >
        <span className="sr-only">{label}</span>
        <span
          aria-hidden
          className={`pointer-events-none block size-[1.375rem] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.04)] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.08)] ${
            featured ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
