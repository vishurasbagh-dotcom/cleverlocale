"use client";

import { useActionState } from "react";
import { createCategory, type CategoryState } from "@/actions/admin-category";

export function CategoryCreateForm() {
  const [state, action, pending] = useActionState(createCategory, {} as CategoryState);

  return (
    <form action={action} className="mt-3 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700 dark:text-emerald-400">Category created.</p>}
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Name</span>
        <input name="name" required className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Slug (optional)</span>
        <input name="slug" className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Description</span>
        <textarea name="description" rows={2} className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? "Saving…" : "Create"}
      </button>
    </form>
  );
}
