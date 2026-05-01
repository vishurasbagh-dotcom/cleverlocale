-- Third option tier + optional swatches flag; extend unique key
DROP INDEX IF EXISTS "product_variants_product_id_value_1_value_2_key";

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "variant_label_3" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "use_variant_colors" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "value_3" TEXT NOT NULL DEFAULT '';
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "color_3" TEXT;

CREATE UNIQUE INDEX "product_variants_product_id_value_1_value_2_value_3_key" ON "product_variants"("product_id", "value_1", "value_2", "value_3");
