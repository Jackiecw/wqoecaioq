"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesImportService = void 0;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const ExcelParser_1 = __importDefault(require("./ExcelParser"));
const ListingMatcher_1 = __importDefault(require("./ListingMatcher"));
const prisma = new client_1.PrismaClient();
class SalesImportService {
    async parsePreview(filePath, platform, storeId) {
        try {
            // 1. Parse Excel
            let parseResult;
            try {
                parseResult = ExcelParser_1.default.parse(filePath, platform);
            }
            catch (e) {
                throw new Error(e.message);
            }
            finally {
                // Clean up temp file
                try {
                    if (fs_1.default.existsSync(filePath)) {
                        fs_1.default.unlinkSync(filePath);
                    }
                }
                catch (err) {
                    console.warn('Failed to delete temp file:', err);
                }
            }
            const { platform: detectedPlatform, data } = parseResult;
            // 2. Match Listings
            const previewData = await Promise.all(data.map(async (item) => {
                const matchResult = await ListingMatcher_1.default.match(detectedPlatform, item.title, item.sku);
                return {
                    ...item,
                    ...matchResult // listingId, matchType
                };
            }));
            // 3. Check for existing orders (Updates)
            if (storeId) {
                const orderIds = previewData.map((item) => item.platformOrderId).filter((id) => id);
                // Find existing sales data for this store and these order IDs
                const existingSales = await prisma.salesData.findMany({
                    where: {
                        storeId: storeId,
                        platformOrderId: { in: orderIds }
                    },
                    select: {
                        platformOrderId: true,
                        orderStatus: true,
                        revenue: true,
                        salesVolume: true
                    }
                });
                // Create a map for quick lookup
                const existingMap = new Map();
                existingSales.forEach(sale => {
                    existingMap.set(sale.platformOrderId, sale);
                });
                // Attach existing data to preview items
                previewData.forEach((item) => {
                    if (existingMap.has(item.platformOrderId)) {
                        item.isUpdate = true;
                        item.existingData = existingMap.get(item.platformOrderId);
                    }
                    else {
                        item.isUpdate = false;
                    }
                });
            }
            return {
                platform: detectedPlatform,
                totalRows: previewData.length,
                data: previewData
            };
        }
        catch (error) {
            throw error;
        }
    }
    async confirmImport(platform, storeId, items, enteredById) {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };
        // 1. Create Import Batch
        const importBatch = await prisma.importBatch.create({
            data: {
                platform: (platform || 'OTHER'),
                fileName: `Import-${new Date().toISOString()}`,
                importedById: enteredById
            }
        });
        for (const item of items) {
            try {
                // 3. Upsert SalesData
                if (item.platformOrderId && item.listingId) {
                    const listing = await prisma.storeProductListing.findUnique({
                        where: { id: item.listingId },
                        include: { store: { include: { country: true } } }
                    });
                    if (!listing)
                        throw new Error(`Listing ${item.listingId} not found`);
                    const countryCode = listing.store.countryCode;
                    let currency = item.currency || 'CNY';
                    if (!item.currency) {
                        const currencyMap = {
                            'ID': 'IDR', 'MY': 'MYR', 'PH': 'PHP', 'SG': 'SGD',
                            'TH': 'THB', 'VN': 'VND', 'TW': 'TWD', 'BR': 'BRL',
                            'US': 'USD', 'UK': 'GBP', 'CN': 'CNY'
                        };
                        currency = currencyMap[countryCode] || 'CNY';
                    }
                    await prisma.salesData.upsert({
                        where: {
                            platformOrderId: item.platformOrderId
                        },
                        update: {
                            orderStatus: item.orderStatus,
                            revenue: item.revenue,
                            listingId: item.listingId,
                            productId: listing.productId,
                            salesVolume: item.quantity,
                            importBatchId: importBatch.id,
                            currency: currency,
                            platform: platform,
                            externalTitle: item.title,
                            externalSku: item.sku
                        },
                        create: {
                            recordDate: new Date(item.orderDate || new Date()),
                            salesVolume: item.quantity,
                            revenue: item.revenue,
                            notes: `Imported from ${platform}`,
                            enteredById: enteredById,
                            storeId: storeId,
                            productId: listing.productId,
                            listingId: item.listingId,
                            platformOrderId: item.platformOrderId,
                            orderStatus: item.orderStatus,
                            importBatchId: importBatch.id,
                            currency: currency,
                            platform: platform,
                            externalTitle: item.title,
                            externalSku: item.sku
                        }
                    });
                    results.success++;
                }
                else {
                    throw new Error('Missing platformOrderId or listingId');
                }
            }
            catch (e) {
                console.error('Error processing item:', e);
                results.failed++;
                results.errors.push({ orderId: item.platformOrderId, error: e.message });
            }
        }
        return results;
    }
    async getBatches(query, user) {
        const { country, platform, userId, page = 1, pageSize = 20 } = query;
        const skip = (parseInt(page) - 1) * parseInt(pageSize);
        const take = parseInt(pageSize);
        const where = {};
        // 1. Apply Filters
        if (platform)
            where.platform = platform;
        if (userId)
            where.importedById = userId;
        if (country) {
            where.salesData = {
                some: {
                    store: {
                        countryCode: country
                    }
                }
            };
        }
        // 2. Apply Permissions
        if (user.role !== 'admin') {
            const permissionConditions = [];
            // Rule 1: Managers can view all records for their supervised countries
            const supervisedCountries = user.supervisedCountries || [];
            if (supervisedCountries.length > 0) {
                permissionConditions.push({
                    salesData: {
                        some: {
                            store: {
                                countryCode: { in: supervisedCountries }
                            }
                        }
                    }
                });
            }
            // Rule 2: Operators (and Managers) can view their own records
            permissionConditions.push({
                importedById: user.userId
            });
            // Combine with OR
            if (where.AND) {
                where.AND.push({ OR: permissionConditions });
            }
            else {
                where.AND = [{ OR: permissionConditions }];
            }
        }
        // Execute Query
        const [total, batches] = await prisma.$transaction([
            prisma.importBatch.count({ where }),
            prisma.importBatch.findMany({
                where,
                skip,
                take,
                orderBy: { importedAt: 'desc' },
                include: {
                    importedBy: { select: { nickname: true, username: true } },
                    _count: { select: { salesData: true } },
                    salesData: {
                        take: 1,
                        select: {
                            store: {
                                select: { country: { select: { name: true, code: true } } }
                            }
                        }
                    }
                }
            })
        ]);
        // Transform result
        const result = batches.map(batch => ({
            id: batch.id,
            platform: batch.platform,
            fileName: batch.fileName,
            importedAt: batch.importedAt,
            importedBy: batch.importedBy,
            count: batch._count.salesData,
            country: batch.salesData[0]?.store?.country || null
        }));
        return {
            data: result,
            total,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages: Math.ceil(total / take)
        };
    }
    async rollbackBatch(id, user) {
        // 1. Find the batch
        const batch = await prisma.importBatch.findUnique({
            where: { id },
            include: {
                salesData: {
                    take: 1,
                    select: { store: { select: { countryCode: true } } }
                }
            }
        });
        if (!batch) {
            throw new Error('Batch not found');
        }
        // 2. Check Permissions
        let canDelete = false;
        if (user.role === 'admin') {
            canDelete = true;
        }
        else {
            // Own record?
            if (batch.importedById === user.userId) {
                canDelete = true;
            }
            // Managed country?
            const batchCountry = batch.salesData[0]?.store?.countryCode;
            if (batchCountry && user.supervisedCountries?.includes(batchCountry)) {
                canDelete = true;
            }
        }
        if (!canDelete) {
            throw new Error('Permission denied');
        }
        // 3. Transaction to delete SalesData and Batch
        await prisma.$transaction([
            prisma.salesData.deleteMany({
                where: { importBatchId: id }
            }),
            prisma.importBatch.delete({
                where: { id: id }
            })
        ]);
        return { success: true };
    }
}
exports.SalesImportService = SalesImportService;
exports.default = new SalesImportService();
//# sourceMappingURL=salesImportService.js.map