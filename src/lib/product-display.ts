/** List / card price: minimum variant price when using per-option pricing. */
export function productListPricePaise(p: {
  pricePaise: number;
  useVariantPricing: boolean;
  variants: { pricePaise: number | null }[];
}): number {
  if (!p.variants.length) return p.pricePaise;
  if (!p.useVariantPricing) return p.pricePaise;
  const prices = p.variants.map((v) => v.pricePaise).filter((x): x is number => x != null && x > 0);
  if (!prices.length) return p.pricePaise;
  return Math.min(...prices);
}

export function productShowFromLabel(p: {
  useVariantPricing: boolean;
  variants: unknown[];
}): boolean {
  return p.useVariantPricing && p.variants.length > 0;
}

/** In-stock units: variant rows sum when the product has options; else base `stock`. */
export function productTotalStock(p: { stock: number; variants: { stock: number }[] }): number {
  if (!p.variants.length) return p.stock;
  return p.variants.reduce((s, v) => s + v.stock, 0);
}

export function variantUnitPaise(
  product: { pricePaise: number; useVariantPricing: boolean },
  variant: { pricePaise: number | null },
): number {
  if (product.useVariantPricing && variant.pricePaise != null) return variant.pricePaise;
  return product.pricePaise;
}

/** Human-readable option line for cart, checkout, and PDP (supports up to 3 tiers). */
export function formatVariantSummary(
  label1: string | null,
  label2: string | null,
  value1: string,
  value2: string,
  label3: string | null = null,
  value3: string = "",
): string {
  const parts: string[] = [];
  if (value1) {
    parts.push(label1 ? `${label1}: ${value1}` : value1);
  }
  if (value2) {
    parts.push(label2 ? `${label2}: ${value2}` : value2);
  }
  if (value3) {
    parts.push(label3 ? `${label3}: ${value3}` : value3);
  }
  return parts.join(" · ");
}
