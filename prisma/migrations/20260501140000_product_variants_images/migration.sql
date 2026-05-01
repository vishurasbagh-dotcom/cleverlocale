-- Product options, images, cart/order variant line items
DROP INDEX IF EXISTS "cart_items_cart_id_product_id_key";

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "variant_label_1" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "variant_label_2" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "use_variant_pricing" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "value_1" TEXT NOT NULL DEFAULT '',
    "value_2" TEXT NOT NULL DEFAULT '',
    "price_paise" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_product_id_value_1_value_2_key" ON "product_variants"("product_id", "value_1", "value_2");

CREATE INDEX IF NOT EXISTS "product_images_product_id_idx" ON "product_images"("product_id");
CREATE INDEX IF NOT EXISTS "product_variants_product_id_idx" ON "product_variants"("product_id");

ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "product_variant_id" TEXT;
CREATE INDEX IF NOT EXISTS "cart_items_cart_id_product_id_idx" ON "cart_items"("cart_id", "product_id");

ALTER TABLE "order_lines" ADD COLUMN IF NOT EXISTS "product_variant_id" TEXT;
ALTER TABLE "order_lines" ADD COLUMN IF NOT EXISTS "variant_summary" TEXT;

ALTER TABLE "product_images" DROP CONSTRAINT IF EXISTS "product_images_product_id_fkey";
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "product_variants_product_id_fkey";
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_product_variant_id_fkey";
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_lines" DROP CONSTRAINT IF EXISTS "order_lines_product_variant_id_fkey";
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
