"use client";

import { useActionState } from "react";
import { placeDummyOrder } from "@/actions/checkout";

export function CheckoutForm() {
  const [state, action, pending] = useActionState(placeDummyOrder, undefined);

  return (
    <form action={action} className="mt-6 space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        This is a <strong>dummy checkout</strong>. No payment is processed. Confirming creates an order in <strong>CONFIRMED</strong>{" "}
        status for testing.
      </p>
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        {pending ? "Placing order…" : "Place order (dummy)"}
      </button>
    </form>
  );
}
