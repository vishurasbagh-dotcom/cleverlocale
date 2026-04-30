"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleAdminVendorShopClosed } from "@/actions/admin-vendors";

/** Admin temporarily hides an approved shop from the marketplace (independent of vendor visibility toggle). */
export function AdminVendorShopToggle({
  vendorId,
  initialAdminClosed,
}: {
  vendorId: string;
  initialAdminClosed: boolean;
}) {
  const router = useRouter();
  const [adminClosed, setAdminClosed] = useOptimistic(initialAdminClosed, (_c, next: boolean) => next);
  const [pending, startTransition] = useTransition();

  function flip() {
    if (pending) return;
    const next = !adminClosed;
    const previous = adminClosed;
    startTransition(async () => {
      setAdminClosed(next);
      const res = await toggleAdminVendorShopClosed(vendorId);
      if (res.ok) {
        setAdminClosed(res.isAdminShopClosed);
        router.refresh();
        return;
      }
      setAdminClosed(previous);
    });
  }

  const statusLabel = adminClosed ? "Shop is closed by Admin" : "Shop is LIVE";
  const titleHint = adminClosed
    ? "Shop is hidden from the marketplace. Click to allow the vendor to go live again (when their shop is open)."
    : "Click to temporarily close this shop as CL Admin. The vendor cannot edit until you turn this off.";

  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-zinc-200/90 bg-white px-3 py-2 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/80"
      title={titleHint}
    >
      <div className="min-w-0 flex-1 text-end">
        <p
          className={`text-xs font-semibold leading-snug tracking-tight ${
            adminClosed
              ? "text-amber-800 dark:text-amber-200"
              : "text-emerald-800 dark:text-emerald-300"
          }`}
        >
          {statusLabel}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={adminClosed}
        aria-label={`${statusLabel}. ${titleHint}`}
        disabled={pending}
        onClick={flip}
        className={`relative inline-flex h-7 w-[2.875rem] shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-zinc-900 ${
          adminClosed
            ? "bg-gradient-to-b from-amber-500 to-amber-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] dark:from-amber-600 dark:to-amber-700"
            : "bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] dark:from-emerald-600 dark:to-emerald-700"
        }`}
      >
        <span className="sr-only">{statusLabel}</span>
        <span
          aria-hidden
          className={`pointer-events-none block size-[1.375rem] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.04)] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.08)] ${
            adminClosed ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
