/**
 * Default top-level categories created/updated by `npm run db:seed`.
 * Subcategories are created in `prisma/seed.ts` (Indian e‑commerce style tree).
 */
export const DEFAULT_SEED_ROOT_CATEGORIES = [
  {
    slug: "grocery-gourmet",
    name: "Grocery & Gourmet",
    description: "Staples, spices, snacks, beverages & everyday groceries",
  },
  {
    slug: "mobiles-accessories",
    name: "Mobiles & Accessories",
    description: "Smartphones, cases, chargers, audio & wearables",
  },
  {
    slug: "electronics-appliances",
    name: "Electronics & Appliances",
    description: "TV, audio, small appliances & home electronics",
  },
  {
    slug: "fashion",
    name: "Fashion",
    description: "Clothing, footwear, ethnic & western wear",
  },
  {
    slug: "home-kitchen",
    name: "Home & Kitchen",
    description: "Cookware, dinnerware, décor, storage & furnishings",
  },
  {
    slug: "beauty-personal-care",
    name: "Beauty & Personal Care",
    description: "Skin care, hair care, grooming & fragrances",
  },
  {
    slug: "sports-fitness-outdoors",
    name: "Sports, Fitness & Outdoors",
    description: "Fitness, cricket, badminton, yoga & outdoor gear",
  },
  {
    slug: "books-stationery",
    name: "Books & Stationery",
    description: "Books, exam prep, office & school supplies",
  },
  {
    slug: "baby-kids",
    name: "Baby & Kids",
    description: "Baby care, feeding, toys & kids’ essentials",
  },
] as const;

/** @deprecated Use DEFAULT_SEED_ROOT_CATEGORIES — kept for prisma/seed import stability */
export const CANONICAL_CATEGORIES = DEFAULT_SEED_ROOT_CATEGORIES;
