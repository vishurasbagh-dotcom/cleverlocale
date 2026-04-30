/**
 * Default top-level categories created/updated by `npm run db:seed`.
 * CL Admins can add subcategories and additional categories from the admin panel.
 */
export const DEFAULT_SEED_ROOT_CATEGORIES = [
  { slug: "electronics", name: "Electronics", description: "Electronics and accessories" },
  { slug: "groceries-provision", name: "Groceries / Provision", description: "Groceries and provisions" },
  { slug: "baby-products", name: "Baby Products", description: "Baby care and essentials" },
  { slug: "pc-and-laptops", name: "PC and Laptops", description: "PCs, laptops, and accessories" },
] as const;

/** @deprecated Use DEFAULT_SEED_ROOT_CATEGORIES — kept for prisma/seed import stability */
export const CANONICAL_CATEGORIES = DEFAULT_SEED_ROOT_CATEGORIES;
