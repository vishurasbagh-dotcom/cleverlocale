"use client";

import type { Dispatch, SetStateAction } from "react";
import { VariantColorPicker } from "@/components/variant-color-picker";

export type VariantLeafState = {
  id: string;
  name: string;
  stock: string;
  priceRupees: string;
  color1: string;
  color2: string;
  color3: string;
};

export type VariantMidState = { id: string; name: string; leaves: VariantLeafState[] };
export type VariantTopState = { id: string; name: string; mids: VariantMidState[] };

export type NestDepth = 1 | 2 | 3;

export function newVariantId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyLeaf(): VariantLeafState {
  return {
    id: newVariantId(),
    name: "",
    stock: "0",
    priceRupees: "",
    color1: "",
    color2: "",
    color3: "",
  };
}

export function emptyMid(): VariantMidState {
  return { id: newVariantId(), name: "", leaves: [emptyLeaf()] };
}

export function emptyTop(): VariantTopState {
  return { id: newVariantId(), name: "", mids: [emptyMid()] };
}

type Props = {
  nestDepth: NestDepth;
  label1: string;
  label2: string;
  label3: string;
  onLabel1Change: (v: string) => void;
  onLabel2Change: (v: string) => void;
  onLabel3Change: (v: string) => void;
  useVariantColors: boolean;
  onUseVariantColorsChange: (v: boolean) => void;
  tops: VariantTopState[];
  setTops: Dispatch<SetStateAction<VariantTopState[]>>;
};

function LeafRow({
  leaf,
  leafIndex,
  topIndex,
  midIndex,
  tops,
  setTops,
  label3,
  nestDepth,
  useVariantColors,
  label1,
  label2,
  showLeafName,
  showRemoveLeaf,
}: {
  leaf: VariantLeafState;
  leafIndex: number;
  topIndex: number;
  midIndex: number;
  tops: VariantTopState[];
  setTops: Dispatch<SetStateAction<VariantTopState[]>>;
  label3: string;
  nestDepth: NestDepth;
  useVariantColors: boolean;
  label1: string;
  label2: string;
  showLeafName: boolean;
  showRemoveLeaf: boolean;
}) {
  const top = tops[topIndex]!;
  const mid = top.mids[midIndex]!;

  const patchLeaf = (patch: Partial<VariantLeafState>) => {
    setTops((prev) => {
      const next = [...prev];
      const t = next[topIndex]!;
      const mids = [...t.mids];
      const m = mids[midIndex]!;
      const leaves = [...m.leaves];
      leaves[leafIndex] = { ...leaves[leafIndex]!, ...patch };
      mids[midIndex] = { ...m, leaves };
      next[topIndex] = { ...t, mids };
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950">
      <div className="flex flex-wrap items-end gap-3">
        {showLeafName ? (
          <label className="min-w-[8rem] flex-1 text-xs">
            <span className="text-zinc-500">{label3 || "Option"}</span>
            <input
              value={leaf.name}
              onChange={(e) => patchLeaf({ name: e.target.value })}
              placeholder="Black"
              className="mt-0.5 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-black"
            />
          </label>
        ) : null}
        <label className="w-24 text-xs">
          <span className="text-zinc-500">Stock</span>
          <input
            type="number"
            min={0}
            value={leaf.stock}
            onChange={(e) => patchLeaf({ stock: e.target.value })}
            className="mt-0.5 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-black"
          />
        </label>
        <label className="w-[7.5rem] text-xs">
          <span className="text-zinc-500">Price (INR)</span>
          <input
            type="number"
            step="0.01"
            min={0}
            value={leaf.priceRupees}
            placeholder="0.00"
            title="Price for this variant"
            onChange={(e) => patchLeaf({ priceRupees: e.target.value })}
            className="mt-0.5 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-black"
          />
        </label>
        {showRemoveLeaf ? (
          <button
            type="button"
            onClick={() => {
              setTops((prev) => {
                const next = [...prev];
                const t = next[topIndex]!;
                const mids = [...t.mids];
                const m = mids[midIndex]!;
                const leaves = m.leaves.filter((_, j) => j !== leafIndex);
                mids[midIndex] = { ...m, leaves: leaves.length ? leaves : [emptyLeaf()] };
                next[topIndex] = { ...t, mids };
                return next;
              });
            }}
            disabled={mid.leaves.length <= 1}
            className="mb-0.5 rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-900"
          >
            Remove
          </button>
        ) : null}
      </div>
      {useVariantColors ? (
        <div
          className={`mt-3 grid gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800 ${
            nestDepth === 1 ? "sm:grid-cols-1" : nestDepth === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
          }`}
        >
          <VariantColorPicker label={`${label1} (tier 1)`} value={leaf.color1} onChange={(hex) => patchLeaf({ color1: hex })} />
          {nestDepth >= 2 ? (
            <VariantColorPicker label={`${label2} (tier 2)`} value={leaf.color2} onChange={(hex) => patchLeaf({ color2: hex })} />
          ) : null}
          {nestDepth >= 3 ? (
            <VariantColorPicker label={`${label3} (tier 3)`} value={leaf.color3} onChange={(hex) => patchLeaf({ color3: hex })} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function VendorNestedVariantEditor({
  nestDepth,
  label1,
  label2,
  label3,
  onLabel1Change,
  onLabel2Change,
  onLabel3Change,
  useVariantColors,
  onUseVariantColorsChange,
  tops,
  setTops,
}: Props) {
  const depthHint =
    nestDepth === 1
      ? "One level of choices (e.g. sizes only). Each row under a card is that option’s stock and price."
      : nestDepth === 2
        ? "Two levels (e.g. Model → Storage). Add groups under each model; each group has stock and price."
        : "Three levels (e.g. Model → Storage → Color). Add final options inside each storage group.";

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-200/90 bg-gradient-to-b from-zinc-50/80 to-white p-4 dark:border-zinc-700 dark:from-zinc-900/50 dark:to-zinc-950">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Nested options</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{depthHint}</p>
        <p className="mt-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          Pricing is set on each variant below — the main product price is turned off while nested options are on.
        </p>
      </div>

      <div className={`grid gap-3 ${nestDepth === 1 ? "sm:grid-cols-1" : nestDepth === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">Level 1 name</span>
          <input
            value={label1}
            onChange={(e) => onLabel1Change(e.target.value)}
            name="variantLabel1"
            placeholder="e.g. Model or Size"
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
          />
        </label>
        {nestDepth >= 2 ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Level 2 name</span>
            <input
              value={label2}
              onChange={(e) => onLabel2Change(e.target.value)}
              name="variantLabel2"
              placeholder="e.g. Storage"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
            />
          </label>
        ) : (
          <input type="hidden" name="variantLabel2" value="" />
        )}
        {nestDepth >= 3 ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Level 3 name</span>
            <input
              value={label3}
              onChange={(e) => onLabel3Change(e.target.value)}
              name="variantLabel3"
              placeholder="e.g. Color"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
            />
          </label>
        ) : (
          <input type="hidden" name="variantLabel3" value="" />
        )}
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-violet-200/80 bg-violet-50/40 px-3 py-3 text-sm dark:border-violet-900/40 dark:bg-violet-950/25">
        <input
          name="useVariantColors"
          type="checkbox"
          checked={useVariantColors}
          onChange={(e) => onUseVariantColorsChange(e.target.checked)}
          className="mt-1 rounded border-zinc-300"
        />
        <span>
          <span className="font-medium text-violet-950 dark:text-violet-100">Optional color swatches</span>
          <span className="mt-0.5 block text-xs text-violet-900/80 dark:text-violet-200/80">
            Shoppers see palette chips only when this is on. You can set colors per enabled tier on each variant row.
          </span>
        </span>
      </label>

      <div className="space-y-4">
        {tops.map((top, ti) => (
          <div
            key={top.id}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 bg-zinc-50/90 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                {label1 || "Level 1"}
              </span>
              <input
                value={top.name}
                onChange={(e) => {
                  const next = [...tops];
                  next[ti] = { ...top, name: e.target.value };
                  setTops(next);
                }}
                placeholder={nestDepth === 1 ? "e.g. Small" : "e.g. iPhone 16 Pro"}
                className="min-w-[12rem] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium dark:border-zinc-600 dark:bg-black"
              />
              <button
                type="button"
                onClick={() => setTops(tops.filter((_, i) => i !== ti))}
                disabled={tops.length <= 1}
                className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-950/40"
              >
                Remove
              </button>
            </div>

            <div className="space-y-4 p-4 pl-5">
              {nestDepth === 1 ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-zinc-500">Stock & price for this {label1 || "option"}</p>
                  <LeafRow
                    leaf={top.mids[0]?.leaves[0] ?? emptyLeaf()}
                    leafIndex={0}
                    topIndex={ti}
                    midIndex={0}
                    tops={tops}
                    setTops={setTops}
                    label3={label3}
                    nestDepth={nestDepth}
                    useVariantColors={useVariantColors}
                    label1={label1}
                    label2={label2}
                    showLeafName={false}
                    showRemoveLeaf={false}
                  />
                </div>
              ) : (
                top.mids.map((mid, mi) => (
                  <div
                    key={mid.id}
                    className="rounded-xl border border-l-4 border-zinc-200 border-l-emerald-500/70 bg-zinc-50/50 pl-4 pr-3 pb-3 pt-3 dark:border-zinc-700 dark:border-l-emerald-600 dark:bg-zinc-900/30"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{label2 || "Level 2"}</span>
                      <input
                        value={mid.name}
                        onChange={(e) => {
                          const next = [...tops];
                          const mids = [...top.mids];
                          mids[mi] = { ...mid, name: e.target.value };
                          next[ti] = { ...top, mids };
                          setTops(next);
                        }}
                        placeholder="e.g. 256 GB"
                        className="min-w-[10rem] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-black"
                      />
                      {nestDepth >= 2 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...tops];
                            const mids = top.mids.filter((_, j) => j !== mi);
                            next[ti] = { ...top, mids: mids.length ? mids : [emptyMid()] };
                            setTops(next);
                          }}
                          disabled={top.mids.length <= 1}
                          className="text-xs text-red-600 hover:underline disabled:opacity-30"
                        >
                          Remove group
                        </button>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-medium text-zinc-500">
                        {nestDepth === 2
                          ? "Stock & price for this group"
                          : `${label3 || "Level 3"} — final options (stock, price${useVariantColors ? ", optional colors" : ""})`}
                      </p>
                      {nestDepth === 2 ? (
                        <LeafRow
                          key={(mid.leaves[0] ?? emptyLeaf()).id}
                          leaf={mid.leaves[0] ?? emptyLeaf()}
                          leafIndex={0}
                          topIndex={ti}
                          midIndex={mi}
                          tops={tops}
                          setTops={setTops}
                          label3={label3}
                          nestDepth={nestDepth}
                          useVariantColors={useVariantColors}
                          label1={label1}
                          label2={label2}
                          showLeafName={false}
                          showRemoveLeaf={false}
                        />
                      ) : (
                        mid.leaves.map((leaf, li) => (
                          <LeafRow
                            key={leaf.id}
                            leaf={leaf}
                            leafIndex={li}
                            topIndex={ti}
                            midIndex={mi}
                            tops={tops}
                            setTops={setTops}
                            label3={label3}
                            nestDepth={nestDepth}
                            useVariantColors={useVariantColors}
                            label1={label1}
                            label2={label2}
                            showLeafName
                            showRemoveLeaf
                          />
                        ))
                      )}
                      {nestDepth === 3 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...tops];
                            const mids = [...top.mids];
                            mids[mi] = { ...mid, leaves: [...mid.leaves, emptyLeaf()] };
                            next[ti] = { ...top, mids };
                            setTops(next);
                          }}
                          className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                          + Add {label3 || "option"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}

              {nestDepth >= 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    const next = [...tops];
                    next[ti] = { ...top, mids: [...top.mids, emptyMid()] };
                    setTops(next);
                  }}
                  className="w-full rounded-lg border border-dashed border-emerald-300 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50/80 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                >
                  + Add {label2 || "level 2"} under this {label1 || "item"}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setTops([...tops, emptyTop()])}
        className="w-full rounded-xl border-2 border-dashed border-zinc-300 py-3 text-sm font-semibold text-zinc-700 hover:border-emerald-400 hover:text-emerald-800 dark:border-zinc-600 dark:text-zinc-300 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
      >
        + Add another {label1 || "level 1"}
      </button>
    </div>
  );
}
