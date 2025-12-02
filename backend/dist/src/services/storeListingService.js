"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreListingService = void 0;
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dataHelpers_1 = require("../utils/dataHelpers");
class StoreListingService {
    getStartOfWeek() {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }
    getStartOfMonth() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    resolveRateValue(rates, currencyCode) {
        if (!currencyCode || !rates)
            return null;
        return rates[`CNY_${currencyCode}`] ?? rates[currencyCode] ?? null;
    }
    async getStoreListings(filters) {
        const { storeIds, page, pageSize } = filters;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (storeIds && storeIds.length > 0) {
            where.storeId = { in: storeIds };
        }
        else if (storeIds) {
            // If storeIds is passed but empty, it means no access
            // But logic in controller might handle this. 
            // If storeIds is undefined, it means all stores (admin)
        }
        const [total, listings] = await prismaClient_1.default.$transaction([
            prismaClient_1.default.storeProductListing.count({ where }),
            prismaClient_1.default.storeProductListing.findMany({
                where,
                skip,
                take: pageSize,
                include: {
                    product: { select: { sku: true, publicName: true, name: true } },
                    store: { include: { country: true } }
                },
                orderBy: { store: { name: 'asc' } }
            })
        ]);
        if (listings.length === 0) {
            return { data: [], total, page, pageSize };
        }
        const listingIds = listings.map(l => l.id);
        const weekStart = this.getStartOfWeek();
        const monthStart = this.getStartOfMonth();
        const { rates: rateMap } = await (0, dataHelpers_1.getRates)();
        const [totalSalesAgg, monthSalesAgg, weekSalesAgg] = await prismaClient_1.default.$transaction([
            prismaClient_1.default.salesData.groupBy({
                by: ['listingId'],
                _sum: { salesVolume: true },
                where: { listingId: { in: listingIds } },
                orderBy: { listingId: 'asc' }
            }),
            prismaClient_1.default.salesData.groupBy({
                by: ['listingId'],
                _sum: { salesVolume: true },
                where: { listingId: { in: listingIds }, recordDate: { gte: monthStart } },
                orderBy: { listingId: 'asc' }
            }),
            prismaClient_1.default.salesData.groupBy({
                by: ['listingId'],
                _sum: { salesVolume: true },
                where: { listingId: { in: listingIds }, recordDate: { gte: weekStart } },
                orderBy: { listingId: 'asc' }
            })
        ]);
        const salesMap = new Map();
        listingIds.forEach(id => salesMap.set(id, { total: 0, month: 0, week: 0 }));
        totalSalesAgg.forEach(item => {
            if (item.listingId)
                salesMap.get(item.listingId).total = item._sum?.salesVolume || 0;
        });
        monthSalesAgg.forEach(item => {
            if (item.listingId)
                salesMap.get(item.listingId).month = item._sum?.salesVolume || 0;
        });
        weekSalesAgg.forEach(item => {
            if (item.listingId)
                salesMap.get(item.listingId).week = item._sum?.salesVolume || 0;
        });
        const data = listings.map((listing) => {
            const countryCode = listing.store.countryCode;
            const currencyCode = dataHelpers_1.countryCurrencyMap[countryCode] || null;
            let priceRmb = null;
            const rate = this.resolveRateValue(rateMap, currencyCode);
            if (rate) {
                priceRmb = listing.currentPrice / rate;
            }
            const sales = salesMap.get(listing.id);
            return {
                ...listing,
                currencyCode,
                currentPriceRmb: priceRmb,
                lastWeekSales: sales.week,
                thisMonthSales: sales.month,
                totalSales: sales.total,
            };
        });
        return { data, total, page, pageSize };
    }
    async getListingOptions(allowedCountries) {
        const [countries, stores, products] = await Promise.all([
            prismaClient_1.default.managedCountry.findMany({
                where: allowedCountries ? { code: { in: allowedCountries } } : undefined,
                orderBy: { code: 'asc' },
            }),
            prismaClient_1.default.store.findMany({
                where: allowedCountries ? { countryCode: { in: allowedCountries } } : undefined,
                select: { id: true, name: true, countryCode: true },
                orderBy: { name: 'asc' },
            }),
            prismaClient_1.default.product.findMany({
                orderBy: { sku: 'asc' },
                select: { id: true, sku: true, name: true, publicName: true },
            }),
        ]);
        return {
            countries,
            stores,
            products,
            currencyMap: dataHelpers_1.countryCurrencyMap,
        };
    }
    async getListingsByStore(storeId) {
        return await prismaClient_1.default.storeProductListing.findMany({
            where: { storeId },
            select: {
                id: true,
                storeTitle: true,
                productCode: true,
                storeImageUrl: true,
                product: {
                    select: {
                        sku: true,
                        name: true,
                        publicName: true
                    }
                }
            },
            orderBy: { storeTitle: 'asc' }
        });
    }
    async getListingById(id) {
        const listing = await prismaClient_1.default.storeProductListing.findUnique({
            where: { id },
            include: { store: { select: { countryCode: true } } }
        });
        if (!listing)
            throw new AppError_1.default('未找到该上架商品', 404);
        return listing;
    }
    async createListing(data, file) {
        const payload = { ...data };
        if (file) {
            payload.storeImageUrl = `/uploads/listings/${file.filename}`;
        }
        const newListing = await prismaClient_1.default.storeProductListing.create({
            data: payload,
            include: {
                product: { select: { sku: true, publicName: true, name: true } },
                store: { include: { country: true } }
            }
        });
        const { rates } = await (0, dataHelpers_1.getRates)();
        const currencyCode = dataHelpers_1.countryCurrencyMap[newListing.store.countryCode] || null;
        const conversionRate = this.resolveRateValue(rates, currencyCode);
        const convertedPrice = conversionRate ? newListing.currentPrice / conversionRate : null;
        return {
            ...newListing,
            currencyCode,
            currentPriceRmb: convertedPrice,
            lastWeekSales: 0,
            thisMonthSales: 0,
            totalSales: 0,
        };
    }
    async updateListing(id, data, file) {
        const oldListing = await prismaClient_1.default.storeProductListing.findUnique({
            where: { id },
            include: { store: { select: { countryCode: true } } }
        });
        if (!oldListing) {
            if (file)
                fs_1.default.unlinkSync(file.path);
            throw new AppError_1.default('未找到该上架商品', 404);
        }
        const payload = { ...data };
        if (file) {
            payload.storeImageUrl = `/uploads/listings/${file.filename}`;
            if (oldListing.storeImageUrl) {
                try {
                    const absoluteOldPath = path_1.default.join(process.cwd(), oldListing.storeImageUrl.startsWith('/') ? oldListing.storeImageUrl.slice(1) : oldListing.storeImageUrl);
                    if (fs_1.default.existsSync(absoluteOldPath)) {
                        fs_1.default.unlinkSync(absoluteOldPath);
                    }
                }
                catch (e) {
                    console.error("Failed to delete old image", e);
                }
            }
        }
        const updatedListing = await prismaClient_1.default.storeProductListing.update({
            where: { id },
            data: payload,
            include: {
                product: { select: { sku: true, publicName: true, name: true } },
                store: { include: { country: true } }
            }
        });
        return {
            ...updatedListing,
            currencyCode: dataHelpers_1.countryCurrencyMap[updatedListing.store.countryCode] || null,
        };
    }
    async deleteListing(id) {
        const listing = await prismaClient_1.default.storeProductListing.findUnique({ where: { id } });
        if (!listing)
            throw new AppError_1.default('未找到该上架商品', 404);
        if (listing.storeImageUrl) {
            try {
                const absoluteOldPath = path_1.default.join(process.cwd(), listing.storeImageUrl.startsWith('/') ? listing.storeImageUrl.slice(1) : listing.storeImageUrl);
                if (fs_1.default.existsSync(absoluteOldPath)) {
                    fs_1.default.unlinkSync(absoluteOldPath);
                }
            }
            catch (e) {
                console.error("Failed to delete image", e);
            }
        }
        await prismaClient_1.default.storeProductListing.delete({ where: { id } });
    }
}
exports.StoreListingService = StoreListingService;
exports.default = new StoreListingService();
//# sourceMappingURL=storeListingService.js.map