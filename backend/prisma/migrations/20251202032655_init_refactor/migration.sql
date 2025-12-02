-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('SHOPEE', 'TIKTOK_SHOP', 'LAZADA', 'WEBSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('PROJECTOR', 'SCREEN', 'STAND', 'ACCESSORY', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ALIPAY', 'WECHAT_PAY', 'BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('NONE', 'REGULAR', 'SPECIAL');

-- CreateEnum
CREATE TYPE "LogisticsStatus" AS ENUM ('FACTORY', 'WAREHOUSE_READY', 'CONTAINER_LOADED', 'EXPORT_CUSTOMS', 'SHIPPING', 'IMPORT_CUSTOMS', 'LOCAL_DELIVERY', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OS_Type" AS ENUM ('LINUX', 'ANDROID_9', 'ANDROID_10', 'ANDROID_11', 'ANDROID_12', 'ANDROID_13', 'GOOGLE_TV', 'WHALE_OS', 'OTHER');

-- CreateEnum
CREATE TYPE "Focus_Method" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "Keystone_Method" AS ENUM ('AUTO', 'VERTICAL', 'NONE');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('SEA', 'AIR', 'RAIL', 'TRUCK', 'EXPRESS');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('PENDING_PRODUCTION', 'IN_PRODUCTION', 'QC_PENDING', 'PARTIAL_SHIPPED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "MilestoneType" AS ENUM ('BOOKING', 'LOADING', 'EXPORT_CLEARANCE', 'DEPARTED', 'ARRIVED', 'IMPORT_CLEARANCE', 'LAST_MILE', 'DELIVERED', 'WAREHOUSE_IN');

-- CreateEnum
CREATE TYPE "ProductionOrderStatus" AS ENUM ('IN_PRODUCTION', 'PRODUCTION_DONE', 'SHIPPED_OUT', 'CONTAINER_LOADED', 'EXPORTED', 'IN_TRANSIT', 'IMPORTED', 'DELIVERING', 'WAREHOUSED');

-- CreateEnum
CREATE TYPE "LogisticsBillingMethod" AS ENUM ('BY_CBM', 'BY_WEIGHT', 'FLAT_FEE');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'SELF_REVIEW', 'MANAGER_REVIEW', 'DIRECTOR_REVIEW', 'COMPLETED', 'CANCELED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roleId" TEXT NOT NULL,
    "managerId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platformStoreId" TEXT,
    "status" "StoreStatus" NOT NULL,
    "registeredAt" TIMESTAMP(3),
    "countryCode" TEXT NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesData" (
    "id" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "salesVolume" INTEGER NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "currency" TEXT DEFAULT 'CNY',
    "notes" TEXT,
    "platformOrderId" TEXT,
    "orderStatus" TEXT,
    "enteredById" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "externalTitle" TEXT,
    "externalSku" TEXT,
    "listingId" TEXT,
    "importBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT,

    CONSTRAINT "SalesData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "fileName" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedById" TEXT NOT NULL,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "summaryThisWeek" TEXT NOT NULL,
    "planNextWeek" TEXT NOT NULL,
    "problemsEncountered" TEXT,
    "other" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagedCountry" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "establishedAt" TIMESTAMP(3),

    CONSTRAINT "ManagedCountry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "category" "ProductCategory" NOT NULL,
    "cost" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "lengthMm" INTEGER,
    "widthMm" INTEGER,
    "heightMm" INTEGER,
    "publicName" TEXT,
    "resolution" TEXT,
    "brightnessAnsi" INTEGER,
    "brightnessUniformity" INTEGER,
    "lightSourceBrightness" INTEGER,
    "noiseDb" INTEGER,
    "contrastRatio" TEXT,
    "throwRatio" TEXT,
    "projectionSize" TEXT,
    "projectionDistance" TEXT,
    "chipset" TEXT,
    "ramRom" TEXT,
    "os" "OS_Type",
    "focusMethod" "Focus_Method",
    "keystone" "Keystone_Method",
    "hasGimbal" BOOLEAN NOT NULL DEFAULT false,
    "wifiVersion" TEXT,
    "bluetoothVersion" TEXT,
    "autoObstacle" BOOLEAN NOT NULL DEFAULT false,
    "autoScreenFit" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreProductListing" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productCode" TEXT,
    "storeTitle" TEXT,
    "storeImageUrl" TEXT,
    "currentPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platformUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "StoreProductListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingMapping" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "externalTitle" TEXT,
    "externalSku" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationModule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "countryCode" TEXT NOT NULL,
    "ownerId" TEXT,

    CONSTRAINT "OperationModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationTask" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "moduleId" TEXT NOT NULL,
    "ownerId" TEXT,

    CONSTRAINT "OperationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommonLink" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommonLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringTask" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "period" "TaskPeriod" NOT NULL,
    "lastCompletedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,

    CONSTRAINT "RecurringTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "authorId" TEXT NOT NULL,
    "createdByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "adminCreatorId" TEXT,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyFocus" (
    "id" TEXT NOT NULL,
    "weekStartDate" DATE NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyFocus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'OTHER',
    "payer" TEXT NOT NULL,
    "payee" TEXT NOT NULL,
    "invoiceStatus" "InvoiceStatus" NOT NULL DEFAULT 'NONE',
    "isAdvancePayment" BOOLEAN NOT NULL DEFAULT false,
    "reimbursementDate" TIMESTAMP(3),
    "notes" TEXT,
    "storeId" TEXT,
    "enteredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "orderDate" DATE NOT NULL,
    "productId" TEXT NOT NULL,
    "productSpec" TEXT,
    "countryCode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "productionTimeDays" INTEGER,
    "estimatedFactoryDate" DATE,
    "logisticsProvider" TEXT,
    "freightForwarder" TEXT,
    "cartonCount" INTEGER,
    "totalCbm" DOUBLE PRECISION,
    "totalKg" DOUBLE PRECISION,
    "estimatedWarehouseDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentStatus" "LogisticsStatus" NOT NULL DEFAULT 'FACTORY',

    CONSTRAINT "LogisticsBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsEvent" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "status" "LogisticsStatus" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogisticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionBatch" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "batchSequence" INTEGER NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionOrder" (
    "id" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "orderSequence" INTEGER NOT NULL,
    "orderDate" DATE NOT NULL,
    "status" "ProductionOrderStatus" NOT NULL DEFAULT 'IN_PRODUCTION',
    "productId" TEXT NOT NULL,
    "skuName" TEXT NOT NULL,
    "productColor" TEXT NOT NULL,
    "productSpec" TEXT NOT NULL,
    "salesRegion" TEXT NOT NULL,
    "plugSpec" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "outboundDate" DATE,
    "logisticsProvider" TEXT,
    "logisticsUnitPrice" DOUBLE PRECISION,
    "warehousingProvider" TEXT,
    "cartonCount" INTEGER,
    "totalCbm" DOUBLE PRECISION,
    "totalKg" DOUBLE PRECISION,
    "billingCbm" DOUBLE PRECISION,
    "billingKg" DOUBLE PRECISION,
    "billingMethod" "LogisticsBillingMethod",
    "logisticsFee" DOUBLE PRECISION,
    "warehouseDate" DATE,
    "notes" TEXT,
    "batchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionOrderStatusEvent" (
    "id" TEXT NOT NULL,
    "status" "ProductionOrderStatus" NOT NULL,
    "occurredAt" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "ProductionOrderStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "orderDate" DATE NOT NULL,
    "exFactoryDate" DATE,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "shippedQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'PENDING_PRODUCTION',
    "notes" TEXT,
    "isProductionLate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "transportMode" "TransportMode" NOT NULL,
    "forwarder" TEXT,
    "blNo" TEXT,
    "containerNo" TEXT,
    "trackingNumber" TEXT,
    "etd" DATE,
    "eta" DATE,
    "atd" DATE,
    "ata" DATE,
    "freightCost" DOUBLE PRECISION,
    "duty" DOUBLE PRECISION,
    "otherCharges" DOUBLE PRECISION,
    "isDelayed" BOOLEAN NOT NULL DEFAULT false,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentItem" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalCbm" DOUBLE PRECISION,
    "totalKg" DOUBLE PRECISION,
    "freightShare" DOUBLE PRECISION,
    "dutyShare" DOUBLE PRECISION,
    "landedCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inbound" (
    "id" TEXT NOT NULL,
    "inboundDate" DATE NOT NULL,
    "quantity" INTEGER NOT NULL,
    "warehouse" TEXT,
    "countryCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shipmentItemId" TEXT NOT NULL,

    CONSTRAINT "Inbound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentMilestone" (
    "id" TEXT NOT NULL,
    "type" "MilestoneType" NOT NULL,
    "occurredAt" DATE,
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shipmentId" TEXT NOT NULL,

    CONSTRAINT "ShipmentMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceTemplateItem" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "kpiName" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "PerformanceTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceReview" (
    "id" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "employeeId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "directorId" TEXT,
    "templateId" TEXT NOT NULL,
    "selfScoreTotal" DOUBLE PRECISION,
    "managerScoreTotal" DOUBLE PRECISION,
    "directorScoreTotal" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,
    "summaryThisMonth" TEXT,
    "planNextMonth" TEXT,
    "companySuggestions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceReviewItem" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "kpiName" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL,
    "selfScore" DOUBLE PRECISION,
    "selfComment" TEXT,
    "managerScore" DOUBLE PRECISION,
    "managerComment" TEXT,
    "directorScore" DOUBLE PRECISION,
    "directorComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceReviewItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MenuItemToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MenuItemToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CountrySupervisors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CountrySupervisors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CountryOperators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CountryOperators_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_key_key" ON "MenuItem"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Store_name_key" ON "Store"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SalesData_platformOrderId_key" ON "SalesData"("platformOrderId");

-- CreateIndex
CREATE INDEX "SalesData_platform_externalTitle_idx" ON "SalesData"("platform", "externalTitle");

-- CreateIndex
CREATE INDEX "SalesData_platform_externalSku_idx" ON "SalesData"("platform", "externalSku");

-- CreateIndex
CREATE INDEX "SalesData_importBatchId_idx" ON "SalesData"("importBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "ManagedCountry_code_key" ON "ManagedCountry"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "ListingMapping_listingId_idx" ON "ListingMapping"("listingId");

-- CreateIndex
CREATE INDEX "ListingMapping_externalTitle_idx" ON "ListingMapping"("externalTitle");

-- CreateIndex
CREATE INDEX "ListingMapping_externalSku_idx" ON "ListingMapping"("externalSku");

-- CreateIndex
CREATE INDEX "OperationModule_countryCode_displayOrder_idx" ON "OperationModule"("countryCode", "displayOrder");

-- CreateIndex
CREATE INDEX "OperationTask_moduleId_displayOrder_idx" ON "OperationTask"("moduleId", "displayOrder");

-- CreateIndex
CREATE INDEX "Todo_authorId_createdAt_idx" ON "Todo"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "RecurringTask_authorId_period_idx" ON "RecurringTask"("authorId", "period");

-- CreateIndex
CREATE INDEX "CalendarEvent_authorId_startAt_endAt_idx" ON "CalendarEvent"("authorId", "startAt", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyFocus_weekStartDate_key" ON "WeeklyFocus"("weekStartDate");

-- CreateIndex
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");

-- CreateIndex
CREATE INDEX "Expense_storeId_idx" ON "Expense"("storeId");

-- CreateIndex
CREATE INDEX "Expense_enteredById_idx" ON "Expense"("enteredById");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsBatch_batchNumber_key" ON "LogisticsBatch"("batchNumber");

-- CreateIndex
CREATE INDEX "LogisticsBatch_countryCode_idx" ON "LogisticsBatch"("countryCode");

-- CreateIndex
CREATE INDEX "LogisticsBatch_productId_idx" ON "LogisticsBatch"("productId");

-- CreateIndex
CREATE INDEX "LogisticsBatch_currentStatus_idx" ON "LogisticsBatch"("currentStatus");

-- CreateIndex
CREATE INDEX "LogisticsEvent_batchId_idx" ON "LogisticsEvent"("batchId");

-- CreateIndex
CREATE INDEX "ProductionBatch_countryCode_idx" ON "ProductionBatch"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionBatch_countryCode_batchSequence_key" ON "ProductionBatch"("countryCode", "batchSequence");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrder_orderCode_key" ON "ProductionOrder"("orderCode");

-- CreateIndex
CREATE INDEX "ProductionOrder_batchId_idx" ON "ProductionOrder"("batchId");

-- CreateIndex
CREATE INDEX "ProductionOrder_status_idx" ON "ProductionOrder"("status");

-- CreateIndex
CREATE INDEX "ProductionOrder_salesRegion_idx" ON "ProductionOrder"("salesRegion");

-- CreateIndex
CREATE INDEX "ProductionOrderStatusEvent_orderId_status_idx" ON "ProductionOrderStatusEvent"("orderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrderStatusEvent_orderId_status_key" ON "ProductionOrderStatusEvent"("orderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_countryCode_status_idx" ON "PurchaseOrder"("countryCode", "status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_productId_idx" ON "PurchaseOrder"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");

-- CreateIndex
CREATE INDEX "Shipment_countryCode_eta_idx" ON "Shipment"("countryCode", "eta");

-- CreateIndex
CREATE INDEX "Shipment_isDelayed_idx" ON "Shipment"("isDelayed");

-- CreateIndex
CREATE INDEX "ShipmentItem_shipmentId_idx" ON "ShipmentItem"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentItem_purchaseOrderId_idx" ON "ShipmentItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "ShipmentItem_productId_idx" ON "ShipmentItem"("productId");

-- CreateIndex
CREATE INDEX "Inbound_countryCode_inboundDate_idx" ON "Inbound"("countryCode", "inboundDate");

-- CreateIndex
CREATE INDEX "Inbound_shipmentItemId_idx" ON "Inbound"("shipmentItemId");

-- CreateIndex
CREATE INDEX "ShipmentMilestone_shipmentId_type_idx" ON "ShipmentMilestone"("shipmentId", "type");

-- CreateIndex
CREATE INDEX "PerformanceReview_employeeId_idx" ON "PerformanceReview"("employeeId");

-- CreateIndex
CREATE INDEX "PerformanceReview_managerId_idx" ON "PerformanceReview"("managerId");

-- CreateIndex
CREATE INDEX "PerformanceReview_status_idx" ON "PerformanceReview"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceReview_employeeId_month_templateId_key" ON "PerformanceReview"("employeeId", "month", "templateId");

-- CreateIndex
CREATE INDEX "_MenuItemToRole_B_index" ON "_MenuItemToRole"("B");

-- CreateIndex
CREATE INDEX "_CountrySupervisors_B_index" ON "_CountrySupervisors"("B");

-- CreateIndex
CREATE INDEX "_CountryOperators_B_index" ON "_CountryOperators"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "ManagedCountry"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesData" ADD CONSTRAINT "SalesData_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesData" ADD CONSTRAINT "SalesData_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesData" ADD CONSTRAINT "SalesData_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "StoreProductListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesData" ADD CONSTRAINT "SalesData_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesData" ADD CONSTRAINT "SalesData_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProductListing" ADD CONSTRAINT "StoreProductListing_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProductListing" ADD CONSTRAINT "StoreProductListing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingMapping" ADD CONSTRAINT "ListingMapping_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "StoreProductListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationModule" ADD CONSTRAINT "OperationModule_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "ManagedCountry"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationModule" ADD CONSTRAINT "OperationModule_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationTask" ADD CONSTRAINT "OperationTask_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "OperationModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationTask" ADD CONSTRAINT "OperationTask_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTask" ADD CONSTRAINT "RecurringTask_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_adminCreatorId_fkey" FOREIGN KEY ("adminCreatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyFocus" ADD CONSTRAINT "WeeklyFocus_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsBatch" ADD CONSTRAINT "LogisticsBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsBatch" ADD CONSTRAINT "LogisticsBatch_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "ManagedCountry"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsEvent" ADD CONSTRAINT "LogisticsEvent_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "LogisticsBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsEvent" ADD CONSTRAINT "LogisticsEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionBatch" ADD CONSTRAINT "ProductionBatch_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "ManagedCountry"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductionBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrderStatusEvent" ADD CONSTRAINT "ProductionOrderStatusEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrderStatusEvent" ADD CONSTRAINT "ProductionOrderStatusEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "ManagedCountry"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "ManagedCountry"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inbound" ADD CONSTRAINT "Inbound_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "ManagedCountry"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inbound" ADD CONSTRAINT "Inbound_shipmentItemId_fkey" FOREIGN KEY ("shipmentItemId") REFERENCES "ShipmentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentMilestone" ADD CONSTRAINT "ShipmentMilestone_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceTemplateItem" ADD CONSTRAINT "PerformanceTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PerformanceTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PerformanceTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReviewItem" ADD CONSTRAINT "PerformanceReviewItem_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "PerformanceReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MenuItemToRole" ADD CONSTRAINT "_MenuItemToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MenuItemToRole" ADD CONSTRAINT "_MenuItemToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CountrySupervisors" ADD CONSTRAINT "_CountrySupervisors_A_fkey" FOREIGN KEY ("A") REFERENCES "ManagedCountry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CountrySupervisors" ADD CONSTRAINT "_CountrySupervisors_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CountryOperators" ADD CONSTRAINT "_CountryOperators_A_fkey" FOREIGN KEY ("A") REFERENCES "ManagedCountry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CountryOperators" ADD CONSTRAINT "_CountryOperators_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
