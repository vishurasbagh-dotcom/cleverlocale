"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleVendorShopOpen } from "@/actions/vendor-shop";

export function VendorShopOpenToggle({
  initialOpen,
  disabled,
  adminFrozen = false,
}: {
  initialOpen: boolean;
  disabled?: boolean;
  /** CL Admin has temporarily closed the shop; vendor cannot toggle until lifted. */
  adminFrozen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useOptimistic(initialOpen, (_current, next: boolean) => next);
  const [pending, startTransition] = useTransition();

  function flip() {
    if (disabled || adminFrozen || pending) return;
    const next = !open;
    const previous = open;
    startTransition(async () => {
      setOpen(next);
      const res = await toggleVendorShopOpen();
      if (res.ok) {
        setOpen(res.isShopOpen);
        router.refresh();
        return;
      }
      setOpen(previous);
    });
  }

  const locked = disabled || adminFrozen || pending;
  /** When admin-frozen, always show “hidden” so the control matches marketplace reality. */
  const visualOpen = !adminFrozen && open;

  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/90">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2 gap-y-1">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Marketplace visibility
            </h2>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                adminFrozen
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
                  : visualOpen
                    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
                    : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {adminFrozen ? "Admin hold" : visualOpen ? "Live" : "Hidden"}
            </span>
          </div>
          <p className="max-w-prose text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            When off, your shop and products are hidden from Cleverlocale shoppers. While your shop is closed (by you or CL
            Admin), profile and catalog editing are paused.
          </p>
          {adminFrozen ? (
            <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-sm font-medium leading-snug text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
              CL Admin has temporarily closed your shop — this switch stays off until they lift the closure.
            </p>
          ) : null}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={visualOpen}
          aria-label={
            adminFrozen
              ? "Marketplace visibility locked by CL Admin"
              : visualOpen
                ? "Shop is visible on the marketplace. Click to hide."
                : "Shop is hidden from the marketplace. Click to go live."
          }
          disabled={locked}
          onClick={flip}
          className={`relative inline-flex h-7 w-[2.875rem] shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-55 dark:focus-visible:ring-offset-zinc-900 ${
            visualOpen
              ? "bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] dark:from-emerald-600 dark:to-emerald-700"
              : "bg-gradient-to-b from-zinc-400 to-zinc-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] dark:from-zinc-600 dark:to-zinc-700"
          }`}
        >
          <span className="sr-only">{visualOpen ? "Visible on marketplace" : "Hidden from marketplace"}</span>
          <span
            aria-hidden
            className={`pointer-events-none block size-[1.375rem] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.04)] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.08)] ${
              visualOpen ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
