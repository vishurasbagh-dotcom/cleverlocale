"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/actions/cart";
import { formatVariantSummary, variantUnitPaise } from "@/lib/product-display";
import { isValidVariantHex } from "@/lib/variant-color-presets";
import { formatInr } from "@/lib/money";

type Variant = {
  id: string;
  value1: string;
  value2: string;
  value3: string;
  color1: string | null;
  color2: string | null;
  color3: string | null;
  stock: number;
  pricePaise: number | null;
};

function QuantityStepper({
  value,
  max,
  disabled,
  idPrefix,
  onDecrement,
  onIncrement,
}: {
  value: number;
  max: number;
  disabled?: boolean;
  idPrefix: string;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const atMin = value <= 1;
  const atMax = value >= max;
  return (
    <div
      className="inline-flex items-stretch overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-600"
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        id={`${idPrefix}-dec`}
        disabled={disabled || atMin}
        aria-label="Decrease quantity"
        onClick={onDecrement}
        className="flex w-10 items-center justify-center bg-zinc-100 text-lg font-medium leading-none text-zinc-800 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        −
      </button>
      <span
        className="flex min-w-[2.75rem] items-center justify-center bg-white px-2 text-center text-sm font-semibold tabular-nums text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        id={`${idPrefix}-inc`}
        disabled={disabled || atMax || max < 1}
        aria-label="Increase quantity"
        onClick={onIncrement}
        className="flex w-10 items-center justify-center bg-zinc-100 text-lg font-medium leading-none text-zinc-800 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        +
      </button>
    </div>
  );
}

function Swatch({ hex, show }: { hex: string | null; show: boolean }) {
  if (!show || !hex || !isValidVariantHex(hex)) return null;
  return (
    <span
      className="h-7 w-7 shrink-0 rounded-full border border-zinc-200 shadow-sm dark:border-zinc-600"
      style={{ backgroundColor: hex }}
      title={hex}
    />
  );
}

export function ProductPurchaseSection(props: {
  productId: string;
  pricePaise: number;
  useVariantPricing: boolean;
  useVariantColors: boolean;
  variantLabel1: string | null;
  variantLabel2: string | null;
  variantLabel3: string | null;
  variants: Variant[];
  baseStock: number;
}) {
  const {
    productId,
    pricePaise,
    useVariantPricing,
    useVariantColors,
    variantLabel1,
    variantLabel2,
    variantLabel3,
    variants,
    baseStock,
  } = props;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const firstSelectable = useMemo(() => variants.find((v) => v.stock > 0)?.id ?? variants[0]?.id ?? "", [variants]);
  const [selectedId, setSelectedId] = useState(firstSelectable);

  useEffect(() => {
    if (!variants.some((v) => v.id === selectedId)) {
      setSelectedId(firstSelectable);
    }
  }, [firstSelectable, selectedId, variants]);

  const selected = variants.find((v) => v.id === selectedId) ?? null;

  const unitPaise = selected
    ? variantUnitPaise({ pricePaise, useVariantPricing }, { pricePaise: selected.pricePaise })
    : pricePaise;

  const maxQty = variants.length > 0 ? (selected?.stock ?? 0) : baseStock;
  const inStock = maxQty > 0;
  const stockLabel =
    variants.length > 0
      ? selected
        ? selected.stock > 0
          ? `${selected.stock} in stock for this option`
          : "Out of stock for this option"
        : "Choose an option"
      : baseStock > 0
        ? `${baseStock} in stock`
        : "Out of stock";

  const [buyQty, setBuyQty] = useState(1);
  useEffect(() => {
    setBuyQty((prev) => {
      if (maxQty < 1) return 1;
      return Math.min(Math.max(1, prev), maxQty);
    });
  }, [maxQty]);

  const addQty = Math.min(buyQty, maxQty);

  /** Last successful add (units in that click); stays until you add again or open another product. */
  const [addNoticeUnits, setAddNoticeUnits] = useState<number | null>(null);
  const [addNoticeVersion, setAddNoticeVersion] = useState(0);

  useEffect(() => {
    setAddNoticeUnits(null);
    setAddNoticeVersion(0);
  }, [productId]);

  function addBlock(variantId: string | null, btnDisabled: boolean) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled={btnDisabled}
          className="inline-flex min-h-[2.75rem] min-w-[10.5rem] items-center justify-center rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-55 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await addToCart(productId, addQty, variantId);
              if (res?.error) setError(res.error);
              else {
                setAddNoticeUnits(addQty);
                setAddNoticeVersion((v) => v + 1);
                router.refresh();
              }
            });
          }}
        >
          {pending ? (
            <span className="inline-flex items-center justify-center gap-2">
              <span
                className="inline-block size-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                aria-hidden
              />
              Adding…
            </span>
          ) : (
            "Add to cart"
          )}
        </button>
        {addNoticeUnits != null ? (
          <div
            key={addNoticeVersion}
            className="animate-cart-toast-in rounded-lg border border-emerald-200/90 bg-emerald-50/95 px-3 py-2 text-sm shadow-sm dark:border-emerald-800/60 dark:bg-emerald-950/50"
            role="status"
          >
            <p className="font-medium text-emerald-950 dark:text-emerald-100">
              <span className="tabular-nums">{addNoticeUnits}</span>{" "}
              {addNoticeUnits === 1 ? "unit has" : "units have"} been added to your cart.
            </p>
            <p className="mt-1 text-emerald-900/90 dark:text-emerald-200/90">
              <Link
                href="/cart"
                className="font-semibold underline decoration-emerald-700/40 underline-offset-2 hover:decoration-emerald-700 dark:decoration-emerald-400/50"
              >
                View cart
              </Link>
              <span className="text-zinc-600 dark:text-zinc-400"> — review or checkout</span>
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div>
        {error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <p className="mb-3 text-sm text-zinc-500">{stockLabel}</p>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Quantity</span>
            <QuantityStepper
              idPrefix={`buy-${productId}-simple`}
              value={inStock ? buyQty : 1}
              max={Math.max(1, maxQty)}
              disabled={!inStock || pending}
              onDecrement={() => setBuyQty((q) => Math.max(1, q - 1))}
              onIncrement={() => setBuyQty((q) => Math.min(maxQty, q + 1))}
            />
          </div>
        </div>
        {addBlock(null, !inStock || pending || addQty < 1)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <span id="variant-options-label" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Choose a combination
        </span>
        <ul className="mt-2 flex max-w-lg flex-col gap-2" aria-labelledby="variant-options-label">
          {variants.map((v) => {
            const label =
              formatVariantSummary(variantLabel1, variantLabel2, v.value1, v.value2, variantLabel3, v.value3) || "Option";
            const price = variantUnitPaise({ pricePaise, useVariantPricing }, { pricePaise: v.pricePaise });
            const isSelected = selectedId === v.id;
            const oos = v.stock < 1;
            return (
              <li key={v.id}>
                <button
                  type="button"
                  disabled={oos}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(v.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 dark:border-emerald-600 dark:bg-emerald-950/35"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  <span className="flex shrink-0 items-center gap-1.5">
                    <Swatch hex={v.color1} show={useVariantColors} />
                    <Swatch hex={v.color2} show={useVariantColors} />
                    <Swatch hex={v.color3} show={useVariantColors} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{label}</span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {formatInr(price)}
                      {oos ? " · Out of stock" : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-2xl font-medium text-emerald-800 dark:text-emerald-400">{formatInr(unitPaise)}</p>
      <p className="text-sm text-zinc-500">{stockLabel}</p>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">Quantity</span>
          <QuantityStepper
            idPrefix={`buy-${productId}-var`}
            value={inStock ? buyQty : 1}
            max={Math.max(1, maxQty)}
            disabled={!selectedId || !inStock || pending}
            onDecrement={() => setBuyQty((q) => Math.max(1, q - 1))}
            onIncrement={() => setBuyQty((q) => Math.min(maxQty, q + 1))}
          />
        </div>
      </div>

      {addBlock(selectedId ? selectedId : null, !selectedId || !inStock || pending || addQty < 1)}
    </div>
  );
}
