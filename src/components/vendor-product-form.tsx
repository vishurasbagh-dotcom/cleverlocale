"use client";

import { useActionState } from "react";
import { createVendorProduct, type ProductFormState } from "@/actions/vendor-product";

export function VendorProductForm({ categories }: { categories: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(createVendorProduct, {} as ProductFormState);

  return (
    <form action={action} className="mt-6 max-w-xl space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700 dark:text-emerald-400">Product created.</p>}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Name</span>
        <input name="name" required className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">URL slug (optional)</span>
        <input name="slug" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Description</span>
        <textarea name="description" rows={4} className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black" />
      </label>
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
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Stock</span>
        <input name="stock" type="number" min="0" defaultValue={0} required className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Category</span>
        <select name="categoryId" required className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black">
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="isPublished" type="checkbox" className="rounded border-zinc-300" />
        Published (visible in shop)
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600"
      >
        {pending ? "Saving…" : "Create product"}
      </button>
    </form>
  );
}
