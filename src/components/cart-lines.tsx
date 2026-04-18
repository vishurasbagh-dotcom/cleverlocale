"use client";

import Link from "next/link";
import { useTransition } from "react";
import { updateCartItemQuantity } from "@/actions/cart";
import { formatInr } from "@/lib/money";

type Item = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    pricePaise: number;
    slug: string;
    vendor: { slug: string; shopName: string };
  };
};

export function CartLines({ items }: { items: Item[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
      {items.map((line) => (
        <li key={line.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div>
            <Link
              href={`/p/${line.product.vendor.slug}/${line.product.slug}`}
              className="font-medium hover:underline"
            >
              {line.product.name}
            </Link>
            <p className="text-sm text-zinc-500">{line.product.vendor.shopName}</p>
            <p className="mt-1 text-sm">{formatInr(line.product.pricePaise)} each</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`qty-${line.id}`}>
              Quantity
            </label>
            <input
              id={`qty-${line.id}`}
              type="number"
              min={1}
              defaultValue={line.quantity}
              disabled={pending}
              className="w-16 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-black"
              onChange={(e) => {
                const q = Number(e.target.value);
                if (!Number.isFinite(q)) return;
                startTransition(async () => {
                  await updateCartItemQuantity(line.id, Math.floor(q));
                });
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
