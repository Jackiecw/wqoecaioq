import { Request, Response, NextFunction } from 'express';
import storeListingService from '../services/storeListingService';
import { z } from 'zod';
import AppError from '../utils/AppError';
import prisma from '../../prismaClient';

// Helper for permissions
const getAllowedCountries = (req: any) => {
    const { role, operatedCountries = [] } = req.user || {};
    if (role === 'admin') return null;
    return operatedCountries;
};

const ensureCountryAccess = (countryCode: string, req: any) => {
    const allowedCountries = getAllowedCountries(req);
    if (!allowedCountries) return true;
    if (allowedCountries.includes(countryCode)) return true;
    return false;
};

const getStoreIdsForCountries = async (countryCodes: string[]) => {
    if (!countryCodes || countryCodes.length === 0) return null;
    const stores = await prisma.store.findMany({
        where: { countryCode: { in: countryCodes } },
        select: { id: true },
    });
    return stores.map((store) => store.id);
};

// Validation Schemas
const createListingSchema = z.object({
    storeId: z.string().min(1, "storeId is required"),
    productId: z.string().min(1, "productId is required"),
    productCode: z.string().min(1, "productCode is required"),
    storeTitle: z.string().min(1, "storeTitle is required"),
    currentPrice: z.coerce.number().min(0, "currentPrice must be positive"),
    platformUrl: z.string().url("platformUrl must be a valid URL").optional().nullable().or(z.literal('')),
});

const updateListingSchema = z.object({
    storeTitle: z.string().min(1, "storeTitle is required").optional(),
    productCode: z.string().min(1, "productCode is required").optional(),
    currentPrice: z.coerce.number().min(0, "currentPrice must be positive").optional(),
    platformUrl: z.string().url("platformUrl must be a valid URL").optional().nullable().or(z.literal('')),
});

const priceSyncSchema = z.object({
    currentPrice: z.coerce.number().min(0, "价格不能为负数")
});

export class StoreListingController {
    async getStoreListings(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 20;

            const allowedCountries = getAllowedCountries(req);
            const allowedStoreIds = allowedCountries
                ? await getStoreIdsForCountries(allowedCountries)
                : undefined;

            if (allowedCountries && (!allowedStoreIds || allowedStoreIds.length === 0)) {
                return res.json({ data: [], total: 0, page, pageSize });
            }

            const result = await storeListingService.getStoreListings({
                storeIds: allowedStoreIds || undefined,
                page,
                pageSize
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getListingOptions(req: Request, res: Response, next: NextFunction) {
        try {
            const allowedCountries = getAllowedCountries(req);
            const options = await storeListingService.getListingOptions(allowedCountries);
            res.json(options);
        } catch (error) {
            next(error);
        }
    }

    async getListingsByStore(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const store = await prisma.store.findUnique({ where: { id: storeId } });
            if (!store) throw new AppError('店铺未找到', 404);

            if (!ensureCountryAccess(store.countryCode, req)) {
                throw new AppError('权限不足', 403);
            }

            const listings = await storeListingService.getListingsByStore(storeId);
            res.json(listings);
        } catch (error) {
            next(error);
        }
    }

    async getListingById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const listing = await storeListingService.getListingById(id);

            if (listing.store && !ensureCountryAccess(listing.store.countryCode, req)) {
                throw new AppError('权限不足：无法查看该上架商品', 403);
            }
            res.json(listing);
        } catch (error) {
            next(error);
        }
    }

    async createListing(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = createListingSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const data = validation.data;

            const targetStore = await prisma.store.findUnique({
                where: { id: data.storeId },
                select: { countryCode: true }
            });
            if (!targetStore) {
                throw new AppError('目标店铺不存在', 400);
            }
            if (!ensureCountryAccess(targetStore.countryCode, req)) {
                throw new AppError('权限不足：无法在该国家的店铺上架', 403);
            }

            const payload = {
                ...data,
                platformUrl: data.platformUrl || null
            };

            const newListing = await storeListingService.createListing(payload, req.file);
            res.status(201).json(newListing);
        } catch (error) {
            next(error);
        }
    }

    async updateListing(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const oldListing = await storeListingService.getListingById(id);

            if (oldListing.store && !ensureCountryAccess(oldListing.store.countryCode, req)) {
                throw new AppError('权限不足：无法编辑该上架商品', 403);
            }

            const validation = updateListingSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const data = validation.data;

            const payload = {
                ...data,
                platformUrl: data.platformUrl || null
            };

            const updatedListing = await storeListingService.updateListing(id, payload, req.file);
            res.json(updatedListing);
        } catch (error) {
            next(error);
        }
    }

    async deleteListing(req: Request, res: Response, next: NextFunction) {
        try {
            if ((req as any).user?.role !== 'admin') {
                throw new AppError('仅超级管理员可以删除上架商品', 403);
            }
            const { id } = req.params;
            await storeListingService.deleteListing(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // Price Sync (from products.js originally, but belongs here logically)
    async syncPrice(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: listingId } = req.params;
            const { role, supervisedCountries } = (req as any).user;

            const validation = priceSyncSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const { currentPrice } = validation.data;

            const listing = await prisma.storeProductListing.findUnique({
                where: { id: listingId },
                include: { store: { select: { countryCode: true } } }
            });

            if (!listing) {
                throw new AppError('未找到该商品的上架信息', 404);
            }

            const isAdmin = role === 'admin';
            const isSupervisor = supervisedCountries.includes(listing.store.countryCode);

            if (!isAdmin && !isSupervisor) {
                throw new AppError('权限不足：您不是该国家的主管', 403);
            }

            const updatedListing = await prisma.storeProductListing.update({
                where: { id: listingId },
                data: { currentPrice },
                include: { store: { include: { country: true } } }
            });

            res.json(updatedListing);
        } catch (error) {
            next(error);
        }
    }
}

export default new StoreListingController();
