"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreListingController = void 0;
const storeListingService_1 = __importDefault(require("../services/storeListingService"));
const zod_1 = require("zod");
const AppError_1 = __importDefault(require("../utils/AppError"));
const prismaClient_1 = __importDefault(require("../../prismaClient"));
// Helper for permissions
const getAllowedCountries = (req) => {
    const { role, operatedCountries = [] } = req.user || {};
    if (role === 'admin')
        return null;
    return operatedCountries;
};
const ensureCountryAccess = (countryCode, req) => {
    const allowedCountries = getAllowedCountries(req);
    if (!allowedCountries)
        return true;
    if (allowedCountries.includes(countryCode))
        return true;
    return false;
};
const getStoreIdsForCountries = async (countryCodes) => {
    if (!countryCodes || countryCodes.length === 0)
        return null;
    const stores = await prismaClient_1.default.store.findMany({
        where: { countryCode: { in: countryCodes } },
        select: { id: true },
    });
    return stores.map((store) => store.id);
};
// Validation Schemas
const createListingSchema = zod_1.z.object({
    storeId: zod_1.z.string().min(1, "storeId is required"),
    productId: zod_1.z.string().min(1, "productId is required"),
    productCode: zod_1.z.string().min(1, "productCode is required"),
    storeTitle: zod_1.z.string().min(1, "storeTitle is required"),
    currentPrice: zod_1.z.coerce.number().min(0, "currentPrice must be positive"),
    platformUrl: zod_1.z.string().url("platformUrl must be a valid URL").optional().nullable().or(zod_1.z.literal('')),
});
const updateListingSchema = zod_1.z.object({
    storeTitle: zod_1.z.string().min(1, "storeTitle is required").optional(),
    productCode: zod_1.z.string().min(1, "productCode is required").optional(),
    currentPrice: zod_1.z.coerce.number().min(0, "currentPrice must be positive").optional(),
    platformUrl: zod_1.z.string().url("platformUrl must be a valid URL").optional().nullable().or(zod_1.z.literal('')),
});
const priceSyncSchema = zod_1.z.object({
    currentPrice: zod_1.z.coerce.number().min(0, "价格不能为负数")
});
class StoreListingController {
    async getStoreListings(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 20;
            const allowedCountries = getAllowedCountries(req);
            const allowedStoreIds = allowedCountries
                ? await getStoreIdsForCountries(allowedCountries)
                : undefined;
            if (allowedCountries && (!allowedStoreIds || allowedStoreIds.length === 0)) {
                return res.json({ data: [], total: 0, page, pageSize });
            }
            const result = await storeListingService_1.default.getStoreListings({
                storeIds: allowedStoreIds || undefined,
                page,
                pageSize
            });
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getListingOptions(req, res, next) {
        try {
            const allowedCountries = getAllowedCountries(req);
            const options = await storeListingService_1.default.getListingOptions(allowedCountries);
            res.json(options);
        }
        catch (error) {
            next(error);
        }
    }
    async getListingsByStore(req, res, next) {
        try {
            const { storeId } = req.params;
            const store = await prismaClient_1.default.store.findUnique({ where: { id: storeId } });
            if (!store)
                throw new AppError_1.default('店铺未找到', 404);
            if (!ensureCountryAccess(store.countryCode, req)) {
                throw new AppError_1.default('权限不足', 403);
            }
            const listings = await storeListingService_1.default.getListingsByStore(storeId);
            res.json(listings);
        }
        catch (error) {
            next(error);
        }
    }
    async getListingById(req, res, next) {
        try {
            const { id } = req.params;
            const listing = await storeListingService_1.default.getListingById(id);
            if (listing.store && !ensureCountryAccess(listing.store.countryCode, req)) {
                throw new AppError_1.default('权限不足：无法查看该上架商品', 403);
            }
            res.json(listing);
        }
        catch (error) {
            next(error);
        }
    }
    async createListing(req, res, next) {
        try {
            const validation = createListingSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const data = validation.data;
            const targetStore = await prismaClient_1.default.store.findUnique({
                where: { id: data.storeId },
                select: { countryCode: true }
            });
            if (!targetStore) {
                throw new AppError_1.default('目标店铺不存在', 400);
            }
            if (!ensureCountryAccess(targetStore.countryCode, req)) {
                throw new AppError_1.default('权限不足：无法在该国家的店铺上架', 403);
            }
            const payload = {
                ...data,
                platformUrl: data.platformUrl || null
            };
            const newListing = await storeListingService_1.default.createListing(payload, req.file);
            res.status(201).json(newListing);
        }
        catch (error) {
            next(error);
        }
    }
    async updateListing(req, res, next) {
        try {
            const { id } = req.params;
            const oldListing = await storeListingService_1.default.getListingById(id);
            if (oldListing.store && !ensureCountryAccess(oldListing.store.countryCode, req)) {
                throw new AppError_1.default('权限不足：无法编辑该上架商品', 403);
            }
            const validation = updateListingSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const data = validation.data;
            const payload = {
                ...data,
                platformUrl: data.platformUrl || null
            };
            const updatedListing = await storeListingService_1.default.updateListing(id, payload, req.file);
            res.json(updatedListing);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteListing(req, res, next) {
        try {
            if (req.user?.role !== 'admin') {
                throw new AppError_1.default('仅超级管理员可以删除上架商品', 403);
            }
            const { id } = req.params;
            await storeListingService_1.default.deleteListing(id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    // Price Sync (from products.js originally, but belongs here logically)
    async syncPrice(req, res, next) {
        try {
            const { id: listingId } = req.params;
            const { role, supervisedCountries } = req.user;
            const validation = priceSyncSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const { currentPrice } = validation.data;
            const listing = await prismaClient_1.default.storeProductListing.findUnique({
                where: { id: listingId },
                include: { store: { select: { countryCode: true } } }
            });
            if (!listing) {
                throw new AppError_1.default('未找到该商品的上架信息', 404);
            }
            const isAdmin = role === 'admin';
            const isSupervisor = supervisedCountries.includes(listing.store.countryCode);
            if (!isAdmin && !isSupervisor) {
                throw new AppError_1.default('权限不足：您不是该国家的主管', 403);
            }
            const updatedListing = await prismaClient_1.default.storeProductListing.update({
                where: { id: listingId },
                data: { currentPrice },
                include: { store: { include: { country: true } } }
            });
            res.json(updatedListing);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StoreListingController = StoreListingController;
exports.default = new StoreListingController();
//# sourceMappingURL=storeListingController.js.map