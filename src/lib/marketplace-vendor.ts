import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Vendor fields loaded with public product queries. Intentionally omits `isAdminShopClosed` (and other
 * columns) so Prisma does not SELECT `is_admin_shop_closed` — that column may be missing before
 * `npx prisma migrate deploy`, which would otherwise fail every `include: { vendor: true }` with P2022.
 */
export const storefrontVendorSelect = {
  id: true,
  slug: true,
  shopName: true,
} satisfies Prisma.VendorSelect;

let adminShopClosedColumnDetection: Promise<boolean> | null = null;

/** True when the live DB has `vendors.is_admin_shop_closed` (migration applied). */
async function vendorsHasAdminShopClosedColumn(): Promise<boolean> {
  adminShopClosedColumnDetection ??= (async () => {
    const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_catalog = current_database()
          AND table_schema = current_schema()
          AND table_name = 'vendors'
          AND column_name = 'is_admin_shop_closed'
      ) AS "exists"
    `;
    return Boolean(rows[0]?.exists);
  })();
  return adminShopClosedColumnDetection;
}

/**
 * `VendorWhereInput` for products that should appear on the public storefront.
 * Omits `isAdminShopClosed` when that column is missing so older DBs don’t throw P2022.
 * After pulling schema changes, run `npx prisma migrate deploy` on the database in `DATABASE_URL`.
 */
export async function getMarketplaceVendorWhere(
  extra?: Pick<Prisma.VendorWhereInput, "slug">,
): Promise<Prisma.VendorWhereInput> {
  const hasAdminClosed = await vendorsHasAdminShopClosedColumn();
  return {
    status: "APPROVED",
    isShopOpen: true,
    ...(hasAdminClosed ? { isAdminShopClosed: false } : {}),
    ...extra,
  };
}
