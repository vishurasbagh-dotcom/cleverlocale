"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createVendorProduct, type ProductFormState } from "@/actions/vendor-product";
import { flattenLeafCategoryOptions, type CategoryTreeNode } from "@/lib/category-tree";
import { PRODUCT_IMAGE_MAX_FILES } from "@/lib/product-image-constants";
import {
  emptyLeaf,
  emptyTop,
  VendorNestedVariantEditor,
  type NestDepth,
  type VariantTopState,
} from "@/components/vendor-nested-variant-editor";

function flattenNestedToPayload(
  tops: VariantTopState[],
  useVariantColors: boolean,
  nestDepth: NestDepth,
): Array<{
  value1: string;
  value2: string;
  value3: string;
  color1: string | null;
  color2: string | null;
  color3: string | null;
  stock: number;
  priceRupees: number | null;
}> {
  const rows: Array<{
    value1: string;
    value2: string;
    value3: string;
    color1: string | null;
    color2: string | null;
    color3: string | null;
    stock: number;
    priceRupees: number | null;
  }> = [];

  const rowFromLeaf = (
    v1: string,
    v2: string,
    v3: string,
    leaf: { stock: string; priceRupees: string; color1: string; color2: string; color3: string },
  ) => ({
    value1: v1,
    value2: v2,
    value3: v3,
    color1: useVariantColors && leaf.color1.trim() ? leaf.color1.trim() : null,
    color2: useVariantColors && leaf.color2.trim() ? leaf.color2.trim() : null,
    color3: useVariantColors && leaf.color3.trim() ? leaf.color3.trim() : null,
    stock: Math.max(0, Math.floor(Number(leaf.stock) || 0)),
    priceRupees:
      leaf.priceRupees.trim() !== "" ? Math.max(0, Number.parseFloat(leaf.priceRupees)) : null,
  });

  for (const t of tops) {
    const v1 = t.name.trim();
    if (nestDepth === 1) {
      const leaf = t.mids[0]?.leaves[0] ?? emptyLeaf();
      rows.push(rowFromLeaf(v1, "", "", leaf));
      continue;
    }
    for (const m of t.mids) {
      const v2 = m.name.trim();
      if (nestDepth === 2) {
        const leaf = m.leaves[0] ?? emptyLeaf();
        rows.push(rowFromLeaf(v1, v2, "", leaf));
        continue;
      }
      for (const leaf of m.leaves) {
        rows.push(rowFromLeaf(v1, v2, leaf.name.trim(), leaf));
      }
    }
  }
  return rows;
}

export function VendorProductForm({ categoryTree }: { categoryTree: CategoryTreeNode[] }) {
  const [state, action, pending] = useActionState(createVendorProduct, {} as ProductFormState);
  const [formKey, setFormKey] = useState(0);

  const [rootId, setRootId] = useState(() => categoryTree[0]?.id ?? "");
  const selectedRoot = useMemo(() => categoryTree.find((n) => n.id === rootId) ?? null, [categoryTree, rootId]);
  const leafOptions = useMemo(
    () => (selectedRoot ? flattenLeafCategoryOptions([selectedRoot]) : []),
    [selectedRoot],
  );
  const [leafId, setLeafId] = useState(() => leafOptions[0]?.id ?? "");

  useEffect(() => {
    const first = leafOptions[0]?.id ?? "";
    if (first && !leafOptions.some((o) => o.id === leafId)) {
      setLeafId(first);
    } else if (!first) {
      setLeafId("");
    }
  }, [leafOptions, leafId]);

  const [hasOptions, setHasOptions] = useState(false);
  const [enableNestLevel2, setEnableNestLevel2] = useState(true);
  const [enableNestLevel3, setEnableNestLevel3] = useState(true);
  const nestDepth: NestDepth = enableNestLevel3 ? 3 : enableNestLevel2 ? 2 : 1;

  const [useVariantColors, setUseVariantColors] = useState(false);
  const [variantLabel1, setVariantLabel1] = useState("Model");
  const [variantLabel2, setVariantLabel2] = useState("Storage");
  const [variantLabel3, setVariantLabel3] = useState("Color");
  const [variantTops, setVariantTops] = useState<VariantTopState[]>([emptyTop()]);

  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!hasOptions) {
      setUseVariantColors(false);
    }
  }, [hasOptions]);

  useEffect(() => {
    if (state.success) {
      setFormKey((k) => k + 1);
      setHasOptions(false);
      setEnableNestLevel2(true);
      setEnableNestLevel3(true);
      setUseVariantColors(false);
      setVariantTops([emptyTop()]);
      setVariantLabel1("Model");
      setVariantLabel2("Storage");
      setVariantLabel3("Color");
      setImagePreviewUrls([]);
    }
  }, [state.success]);

  useEffect(() => {
    return () => {
      for (const u of imagePreviewUrls) {
        URL.revokeObjectURL(u);
      }
    };
  }, [imagePreviewUrls]);

  const variantsJson = useMemo(() => {
    if (!hasOptions) return "[]";
    return JSON.stringify(flattenNestedToPayload(variantTops, useVariantColors, nestDepth));
  }, [hasOptions, variantTops, useVariantColors, nestDepth]);

  function onImagesChange(files: FileList | null) {
    if (!files?.length) {
      setImagePreviewUrls([]);
      return;
    }
    const list = Array.from(files).slice(0, PRODUCT_IMAGE_MAX_FILES);
    for (const u of imagePreviewUrls) URL.revokeObjectURL(u);
    setImagePreviewUrls(list.map((f) => URL.createObjectURL(f)));
  }

  const showBasePrice = !hasOptions;
  const showBaseStock = !hasOptions;

  return (
    <form
      key={formKey}
      action={action}
      className="mt-6 max-w-3xl space-y-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
    >
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700 dark:text-emerald-400">Product created.</p>}

      <input type="hidden" name="categoryId" value={leafId} />
      <input type="hidden" name="variantsJson" value={variantsJson} />
      <input type="hidden" name="nestDepth" value={nestDepth} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Name</span>
        <input
          name="name"
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">URL slug (optional)</span>
        <input name="slug" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Category</span>
          <select
            value={rootId}
            onChange={(e) => setRootId(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
          >
            {categoryTree.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Subcategory (shelf)</span>
          <select
            value={leafId}
            onChange={(e) => setLeafId(e.target.value)}
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
          >
            {leafOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-500">Pick the most specific category for this product.</span>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Description</span>
        <textarea
          name="description"
          rows={4}
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
      </label>

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Product images</span>
          <span className="text-xs text-zinc-500">
            Up to {PRODUCT_IMAGE_MAX_FILES} images (JPEG, PNG, GIF, WebP). First image is shown first to shoppers.
          </span>
          <input
            name="images"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-1.5 file:text-emerald-900 dark:file:bg-emerald-950 dark:file:text-emerald-100"
            onChange={(e) => onImagesChange(e.target.files)}
          />
        </label>
        {imagePreviewUrls.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {imagePreviewUrls.map((url) => (
              <li key={url} className="h-20 w-20 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {showBasePrice ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Price (INR)</span>
            <input
              name="priceRupees"
              type="number"
              step="0.01"
              min="0"
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
            />
          </label>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">Price (INR)</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Nested options are on — enter <strong>Price (INR)</strong> on each variant row below. The main product price is
              not used.
            </p>
            <input type="hidden" name="priceRupees" value="0" />
          </div>
        )}

        {showBaseStock ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Stock</span>
            <input
              name="stock"
              type="number"
              min="0"
              defaultValue={0}
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
            />
          </label>
        ) : (
          <input type="hidden" name="stock" value="0" />
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={hasOptions}
            onChange={(e) => setHasOptions(e.target.checked)}
            className="mt-1 rounded border-zinc-300"
          />
          <span>
            <span className="font-medium">Nested product options</span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              Turn on to sell variants with one, two, or three levels. <strong>Main price above is disabled</strong> — each
              variant has its own price and stock.
            </span>
          </span>
        </label>

        {hasOptions ? (
          <div className="mt-4 space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">How many levels?</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                <strong>Level 1</strong> is always on (e.g. size or model). Add level 2 and 3 only when you need groups under
                each option.
              </p>
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={enableNestLevel2}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setEnableNestLevel2(v);
                    if (!v) setEnableNestLevel3(false);
                  }}
                  className="mt-1 rounded border-zinc-300"
                />
                <span>
                  <span className="font-medium">Level 2</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">e.g. storage tier under each phone model</span>
                </span>
              </label>
              <label className={`mt-2 flex items-start gap-2 text-sm ${!enableNestLevel2 ? "opacity-45" : ""}`}>
                <input
                  type="checkbox"
                  checked={enableNestLevel3}
                  disabled={!enableNestLevel2}
                  onChange={(e) => setEnableNestLevel3(e.target.checked)}
                  className="mt-1 rounded border-zinc-300 disabled:cursor-not-allowed"
                />
                <span>
                  <span className="font-medium">Level 3</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">e.g. color under each storage size (needs level 2)</span>
                </span>
              </label>
            </div>

            <VendorNestedVariantEditor
              nestDepth={nestDepth}
              label1={variantLabel1}
              label2={variantLabel2}
              label3={variantLabel3}
              onLabel1Change={setVariantLabel1}
              onLabel2Change={setVariantLabel2}
              onLabel3Change={setVariantLabel3}
              useVariantColors={useVariantColors}
              onUseVariantColorsChange={setUseVariantColors}
              tops={variantTops}
              setTops={setVariantTops}
            />
          </div>
        ) : null}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input name="isPublished" type="checkbox" className="rounded border-zinc-300" />
        Published (visible in shop)
      </label>

      <button
        type="submit"
        disabled={pending || !leafId}
        className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600"
      >
        {pending ? "Saving…" : "Create product"}
      </button>
    </form>
  );
}
