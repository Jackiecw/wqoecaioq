-- DropIndex
DROP INDEX "public"."ListingMapping_externalSku_idx";

-- DropIndex
DROP INDEX "public"."ListingMapping_externalTitle_idx";

-- AlterTable
ALTER TABLE "ListingMapping" ADD COLUMN     "platformSkuId" TEXT,
ADD COLUMN     "variationName" TEXT;

-- AlterTable
ALTER TABLE "SalesData" ADD COLUMN     "platformSkuId" TEXT,
ADD COLUMN     "variationName" TEXT;

-- CreateIndex
CREATE INDEX "ListingMapping_platform_platformSkuId_externalSku_idx" ON "ListingMapping"("platform", "platformSkuId", "externalSku");

-- CreateIndex
CREATE INDEX "ListingMapping_platform_externalTitle_externalSku_variation_idx" ON "ListingMapping"("platform", "externalTitle", "externalSku", "variationName");
