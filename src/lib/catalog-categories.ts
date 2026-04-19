/**
 * Cleverlocale platform catalog: exactly four categories. Vendors and search use only these.
 * Keep in sync with `prisma/seed.ts` (seed imports this list).
 */
export const CANONICAL_CATEGORIES = [
  { slug: "electronics", name: "Electronics", description: "Electronics and accessories" },
  { slug: "groceries-provision", name: "Groceries / Provision", description: "Groceries and provisions" },
  { slug: "baby-products", name: "Baby Products", description: "Baby care and essentials" },
  { slug: "pc-and-laptops", name: "PC and Laptops", description: "PCs, laptops, and accessories" },
] as const;

export const CANONICAL_CATEGORY_SLUGS = CANONICAL_CATEGORIES.map((c) => c.slug) as readonly string[];
