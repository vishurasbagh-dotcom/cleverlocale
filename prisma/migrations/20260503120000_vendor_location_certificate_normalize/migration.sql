-- Normalize vendor: address/geo → vendor_shop_locations; certificate metadata → vendor_certificates.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "vendor_shop_locations" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "locality" TEXT,
    "city" TEXT,
    "pincode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_shop_locations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vendor_shop_locations_vendor_id_key" ON "vendor_shop_locations"("vendor_id");

CREATE TABLE "vendor_certificates" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "original_name" TEXT,
    "mime_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_certificates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vendor_certificates_vendor_id_key" ON "vendor_certificates"("vendor_id");

ALTER TABLE "vendor_shop_locations"
ADD CONSTRAINT "vendor_shop_locations_vendor_id_fkey"
FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vendor_certificates"
ADD CONSTRAINT "vendor_certificates_vendor_id_fkey"
FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "vendor_shop_locations" (
    "id",
    "vendor_id",
    "address_line1",
    "address_line2",
    "locality",
    "city",
    "pincode",
    "latitude",
    "longitude",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid()::text,
    v."id",
    v."address_line1",
    v."address_line2",
    v."locality",
    v."city",
    v."pincode",
    v."latitude",
    v."longitude",
    v."created_at",
    v."updated_at"
FROM "vendors" v;

INSERT INTO "vendor_certificates" (
    "id",
    "vendor_id",
    "stored_name",
    "original_name",
    "mime_type",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid()::text,
    v."id",
    v."certificate_stored_name",
    v."certificate_original_name",
    v."certificate_mime_type",
    v."created_at",
    v."updated_at"
FROM "vendors" v
WHERE v."certificate_stored_name" IS NOT NULL;

ALTER TABLE "vendors" DROP COLUMN "address_line1";
ALTER TABLE "vendors" DROP COLUMN "address_line2";
ALTER TABLE "vendors" DROP COLUMN "locality";
ALTER TABLE "vendors" DROP COLUMN "city";
ALTER TABLE "vendors" DROP COLUMN "pincode";
ALTER TABLE "vendors" DROP COLUMN "latitude";
ALTER TABLE "vendors" DROP COLUMN "longitude";
ALTER TABLE "vendors" DROP COLUMN "certificate_stored_name";
ALTER TABLE "vendors" DROP COLUMN "certificate_original_name";
ALTER TABLE "vendors" DROP COLUMN "certificate_mime_type";
