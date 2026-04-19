"use server";

import { auth } from "@/auth";

export type CategoryState = { error?: string; success?: boolean };

/**
 * Creating categories is disabled: the platform uses exactly four fixed categories
 * (see `src/lib/catalog-categories.ts`). Use `npm run db:seed` to sync the DB.
 */
export async function createCategory(_prev: CategoryState, _formData: FormData): Promise<CategoryState> {
  void _prev;
  void _formData;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  return {
    error:
      "New categories cannot be added. Cleverlocale uses exactly four fixed categories: Electronics, Groceries / Provision, Baby Products, and PC and Laptops. To remove extras from the database and restore the list, run: npm run db:seed",
  };
}
