/*
  Warnings:

  - You are about to alter the column `revenue` on the `SalesData` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.

*/
-- AlterTable
ALTER TABLE "SalesData" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "settlementAmount" DECIMAL(12,2),
ADD COLUMN     "settlementDate" DATE,
ALTER COLUMN "revenue" SET DATA TYPE DECIMAL(12,2);
