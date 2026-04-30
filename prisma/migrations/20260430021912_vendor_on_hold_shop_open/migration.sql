-- AlterEnum
ALTER TYPE "VendorStatus" ADD VALUE 'ON_HOLD';

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "is_shop_open" BOOLEAN NOT NULL DEFAULT true;
