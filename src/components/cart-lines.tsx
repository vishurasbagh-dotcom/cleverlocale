"use client";

import Link from "next/link";
import { type TransitionStartFunction, useTransition } from "react";
import { removeFromCart, updateCartItemQuantity } from "@/actions/cart";
import { formatVariantSummary, variantUnitPaise } from "@/lib/product-display";
import { isValidVariantHex } from "@/lib/variant-color-presets";
import { formatInr } from "@/lib/money";

function CartQtyStepper({
  lineId,
  quantity,
  maxStock,
  pending,
  startTransition,
}: {
  lineId: string;
  quantity: number;
  maxStock: number;
  pending: boolean;
  startTransition: TransitionStartFunction;
}) {
  const atMax = quantity >= maxStock;
  return (
    <div
      className="inline-flex items-stretch overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-600"
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        disabled={pending || maxStock < 1 || quantity <= 1}
        aria-label="Decrease quantity"
        onClick={() =>
          startTransition(async () => {
            await updateCartItemQuantity(lineId, quantity - 1);
          })
        }
        className="flex w-9 items-center justify-center bg-zinc-100 text-base font-medium text-zinc-800 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        −
      </button>
      <span className="flex min-w-[2.5rem] items-center justify-center bg-white px-2 text-center text-sm font-semibold tabular-nums dark:bg-zinc-950">
        {quantity}
      </span>
      <button
        type="button"
        disabled={pending || atMax || maxStock < 1}
        aria-label="Increase quantity"
        onClick={() =>
          startTransition(async () => {
            await updateCartItemQuantity(lineId, Math.min(quantity + 1, maxStock));
          })
        }
        className="flex w-9 items-center justify-center bg-zinc-100 text-base font-medium text-zinc-800 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        +
      </button>
    </div>
  );
}

type Item = {
  id: string;
  quantity: number;
  productVariantId: string | null;
  product: {
    id: string;
    name: string;
    pricePaise: number;
    stock: number;
    useVariantPricing: boolean;
    useVariantColors: boolean;
    slug: string;
    variantLabel1: string | null;
    variantLabel2: string | null;
    variantLabel3: string | null;
    vendor: { slug: string; shopName: string };
  };
  productVariant: {
    stock: number;
    value1: string;
    value2: string;
    value3: string;
    color1: string | null;
    color2: string | null;
    color3: string | null;
    pricePaise: number | null;
  } | null;
};

export function CartLines({ items }: { items: Item[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
      {items.map((line) => {
        const unit = line.productVariant
          ? variantUnitPaise(line.product, line.productVariant)
          : variantUnitPaise(line.product, { pricePaise: null });
        const variantLine =
          line.productVariant &&
          formatVariantSummary(
            line.product.variantLabel1,
            line.product.variantLabel2,
            line.productVariant.value1,
            line.productVariant.value2,
            line.product.variantLabel3,
            line.productVariant.value3,
          );
        const maxStock = line.productVariant ? line.productVariant.stock : line.product.stock;
        return (
          <li key={line.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <Link
                href={`/p/${line.product.vendor.slug}/${line.product.slug}`}
                className="font-medium hover:underline"
              >
                {line.product.name}
              </Link>
              {variantLine ? (
                <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {line.productVariant && line.product.useVariantColors ? (
                    <span className="flex items-center gap-1">
                      {isValidVariantHex(line.productVariant.color1) ? (
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full border border-zinc-300 dark:border-zinc-600"
                          style={{ backgroundColor: line.productVariant.color1 }}
                        />
                      ) : null}
                      {isValidVariantHex(line.productVariant.color2) ? (
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full border border-zinc-300 dark:border-zinc-600"
                          style={{ backgroundColor: line.productVariant.color2 }}
                        />
                      ) : null}
                      {isValidVariantHex(line.productVariant.color3) ? (
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full border border-zinc-300 dark:border-zinc-600"
                          style={{ backgroundColor: line.productVariant.color3 }}
                        />
                      ) : null}
                    </span>
                  ) : null}
                  <span>{variantLine}</span>
                </p>
              ) : null}
              <p className="text-sm text-zinc-500">{line.product.vendor.shopName}</p>
              <p className="mt-1 text-sm">{formatInr(unit)} each</p>
              <p className="mt-0.5 text-xs text-zinc-500">Max {maxStock} available</p>
            </div>
            <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center sm:gap-4">
              <CartQtyStepper
                lineId={line.id}
                quantity={line.quantity}
                maxStock={maxStock}
                pending={pending}
                startTransition={startTransition}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await removeFromCart(line.id);
                  })
                }
                className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-800 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/55 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-950/35"
              >
                Remove from cart
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
