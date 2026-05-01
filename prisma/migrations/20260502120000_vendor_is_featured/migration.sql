ALTER TABLE "vendors"
ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "vendors_status_is_featured_idx" ON "vendors" ("status", "is_featured");
