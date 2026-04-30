-- AlterEnum
ALTER TYPE "VendorStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "address_line1" TEXT,
ADD COLUMN     "address_line2" TEXT,
ADD COLUMN     "certificate_mime_type" TEXT,
ADD COLUMN     "certificate_original_name" TEXT,
ADD COLUMN     "certificate_stored_name" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locality" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "shop_description" TEXT;

-- CreateTable
CREATE TABLE "vendor_selling_categories" (
    "vendor_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "vendor_selling_categories_pkey" PRIMARY KEY ("vendor_id","category_id")
);

-- CreateIndex
CREATE INDEX "vendor_selling_categories_category_id_idx" ON "vendor_selling_categories"("category_id");

-- AddForeignKey
ALTER TABLE "vendor_selling_categories" ADD CONSTRAINT "vendor_selling_categories_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_selling_categories" ADD CONSTRAINT "vendor_selling_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
