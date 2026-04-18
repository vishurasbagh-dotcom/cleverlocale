"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/actions/cart";

export function AddToCartForm({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="button"
        disabled={disabled || pending}
        className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await addToCart(productId, 1);
            if (res?.error) setError(res.error);
          });
        }}
      >
        {pending ? "Adding…" : "Add to cart"}
      </button>
    </div>
  );
}
