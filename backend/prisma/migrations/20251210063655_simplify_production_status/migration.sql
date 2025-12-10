/*
  Migration: simplify_production_status
  - Converts old 9-state enum to new 4-state enum
  - Maps old values to new values before enum change
*/

-- Step 1: First, update existing data to use new enum values
-- Map old statuses to new statuses:
-- IN_PRODUCTION -> IN_PRODUCTION (keep)
-- PRODUCTION_DONE -> IN_PRODUCTION
-- SHIPPED_OUT -> SHIPPED
-- CONTAINER_LOADED -> SHIPPED
-- EXPORTED -> SHIPPED
-- IN_TRANSIT -> SHIPPED
-- IMPORTED -> SHIPPED
-- DELIVERING -> SHIPPED
-- WAREHOUSED -> SHIPPED (completed, moved to logistics)

-- Update ProductionOrder table
UPDATE "ProductionOrder" 
SET "status" = 'IN_PRODUCTION'
WHERE "status" IN ('PRODUCTION_DONE');

UPDATE "ProductionOrder"
SET "status" = 'SHIPPED_OUT'
WHERE "status" IN ('SHIPPED_OUT', 'CONTAINER_LOADED', 'EXPORTED', 'IN_TRANSIT', 'IMPORTED', 'DELIVERING', 'WAREHOUSED');

-- Update ProductionOrderStatusEvent table
UPDATE "ProductionOrderStatusEvent"
SET "status" = 'IN_PRODUCTION'
WHERE "status" IN ('PRODUCTION_DONE');

UPDATE "ProductionOrderStatusEvent"
SET "status" = 'SHIPPED_OUT'
WHERE "status" IN ('SHIPPED_OUT', 'CONTAINER_LOADED', 'EXPORTED', 'IN_TRANSIT', 'IMPORTED', 'DELIVERING', 'WAREHOUSED');

-- Step 2: Now apply the enum change
BEGIN;
CREATE TYPE "ProductionOrderStatus_new" AS ENUM ('PENDING', 'IN_PRODUCTION', 'READY', 'SHIPPED');

-- Convert SHIPPED_OUT to SHIPPED for the new enum
UPDATE "ProductionOrder" SET "status" = 'SHIPPED_OUT' WHERE "status" = 'SHIPPED_OUT';
UPDATE "ProductionOrderStatusEvent" SET "status" = 'SHIPPED_OUT' WHERE "status" = 'SHIPPED_OUT';

ALTER TABLE "public"."ProductionOrder" ALTER COLUMN "status" DROP DEFAULT;

-- Use CASE to map old values to new values during conversion
ALTER TABLE "ProductionOrder" ALTER COLUMN "status" TYPE "ProductionOrderStatus_new" 
  USING (
    CASE "status"::text
      WHEN 'IN_PRODUCTION' THEN 'IN_PRODUCTION'
      WHEN 'SHIPPED_OUT' THEN 'SHIPPED'
      ELSE 'PENDING'
    END::text::"ProductionOrderStatus_new"
  );

ALTER TABLE "ProductionOrderStatusEvent" ALTER COLUMN "status" TYPE "ProductionOrderStatus_new"
  USING (
    CASE "status"::text
      WHEN 'IN_PRODUCTION' THEN 'IN_PRODUCTION'
      WHEN 'SHIPPED_OUT' THEN 'SHIPPED'
      ELSE 'PENDING'
    END::text::"ProductionOrderStatus_new"
  );

ALTER TYPE "ProductionOrderStatus" RENAME TO "ProductionOrderStatus_old";
ALTER TYPE "ProductionOrderStatus_new" RENAME TO "ProductionOrderStatus";
DROP TYPE "public"."ProductionOrderStatus_old";
ALTER TABLE "ProductionOrder" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- Step 3: Add status column to ProductionBatch
ALTER TABLE "ProductionBatch" ADD COLUMN "status" "ProductionOrderStatus" NOT NULL DEFAULT 'PENDING';

-- Step 4: Create index
CREATE INDEX "ProductionBatch_status_idx" ON "ProductionBatch"("status");
