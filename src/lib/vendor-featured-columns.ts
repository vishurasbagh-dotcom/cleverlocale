import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

let isFeaturedColumnPromise: Promise<boolean> | null = null;

/** Detects `vendors.is_featured` so we can avoid Prisma Client validation issues on unmigrated DBs or stale clients. */
export async function vendorsHasIsFeaturedColumn(): Promise<boolean> {
  isFeaturedColumnPromise ??= (async () => {
    const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_catalog = current_database()
          AND table_schema = current_schema()
          AND table_name = 'vendors'
          AND column_name = 'is_featured'
      ) AS "exists"
    `;
    return Boolean(rows[0]?.exists);
  })();
  return isFeaturedColumnPromise;
}

export type AdminVendorManagementVendor = {
  id: string;
  slug: string;
  shopName: string;
  city: string | null;
  status: string;
  isShopOpen: boolean;
  isAdminShopClosed: boolean;
  isFeatured: boolean;
};

/** Full-text-style filter for vendor management (Postgres ILIKE, not Elasticsearch). */
function vendorManagementSearchSql(q: string | undefined): Prisma.Sql {
  const trimmed = q?.trim();
  if (!trimmed) return Prisma.sql``;
  const pattern = `%${trimmed}%`;
  return Prisma.sql`AND (
    v.shop_name ILIKE ${pattern}
    OR v.slug ILIKE ${pattern}
    OR COALESCE(l.city, '') ILIKE ${pattern}
    OR COALESCE(l.locality, '') ILIKE ${pattern}
    OR COALESCE(v.shop_description, '') ILIKE ${pattern}
    OR COALESCE(l.address_line1, '') ILIKE ${pattern}
    OR COALESCE(l.address_line2, '') ILIKE ${pattern}
    OR COALESCE(l.pincode, '') ILIKE ${pattern}
    OR COALESCE(v.mobile_number, '') ILIKE ${pattern}
  )`;
}

/**
 * Approved vendors for CL Admin vendor-management (raw SQL — avoids PrismaClientValidationError on `isFeatured`).
 * Always ordered by shop name so toggling “featured” does not reorder the list.
 */
export async function fetchApprovedVendorsForManagement(search?: string | null): Promise<AdminVendorManagementVendor[]> {
  const filter = vendorManagementSearchSql(search ?? undefined);
  const hasFeatured = await vendorsHasIsFeaturedColumn();
  if (hasFeatured) {
    return prisma.$queryRaw<AdminVendorManagementVendor[]>(Prisma.sql`
      SELECT
        v.id,
        v.slug,
        v.shop_name AS "shopName",
        l.city,
        v.status::text AS status,
        v.is_shop_open AS "isShopOpen",
        v.is_admin_shop_closed AS "isAdminShopClosed",
        COALESCE(v.is_featured, false) AS "isFeatured"
      FROM vendors v
      LEFT JOIN vendor_shop_locations l ON l.vendor_id = v.id
      WHERE v.status = 'APPROVED'
      ${filter}
      ORDER BY v.shop_name ASC
    `);
  }

  const rows = await prisma.$queryRaw<
    Array<Omit<AdminVendorManagementVendor, "isFeatured">>
  >(Prisma.sql`
    SELECT
      v.id,
      v.slug,
      v.shop_name AS "shopName",
      l.city,
      v.status::text AS status,
      v.is_shop_open AS "isShopOpen",
      v.is_admin_shop_closed AS "isAdminShopClosed"
    FROM vendors v
    LEFT JOIN vendor_shop_locations l ON l.vendor_id = v.id
    WHERE v.status = 'APPROVED'
    ${filter}
    ORDER BY v.shop_name ASC
  `);
  return rows.map((r) => ({ ...r, isFeatured: false }));
}

/** Featured flags for storefront (badges / sort) without putting `isFeatured` in Prisma `select` objects. */
export async function loadFeaturedFlagsByVendorId(vendorIds: string[]): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  const unique = [...new Set(vendorIds.filter(Boolean))];
  for (const id of unique) map.set(id, false);
  if (!unique.length) return map;

  const hasFeatured = await vendorsHasIsFeaturedColumn();
  if (!hasFeatured) return map;

  const rows = await prisma.$queryRaw<Array<{ id: string; isFeatured: boolean }>>`
    SELECT id, is_featured AS "isFeatured"
    FROM vendors
    WHERE id IN (${Prisma.join(unique.map((id) => Prisma.sql`${id}`))})
  `;
  for (const r of rows) map.set(r.id, Boolean(r.isFeatured));
  return map;
}
