import prisma from '../../prismaClient';
import { StoreProductListing, Prisma } from '@prisma/client';
import AppError from '../utils/AppError';
import fs from 'fs';
import path from 'path';
import { getRates, countryCurrencyMap } from '../utils/dataHelpers';

// Helper types
interface ListingFilters {
    storeIds?: string[];
    page: number;
    pageSize: number;
}

export class StoreListingService {

    private getStartOfWeek() {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    private getStartOfMonth() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }

    private resolveRateValue(rates: any, currencyCode: string | null) {
        if (!currencyCode || !rates) return null;
        return rates[`CNY_${currencyCode}`] ?? rates[currencyCode] ?? null;
    }

    async getStoreListings(filters: ListingFilters) {
        const { storeIds, page, pageSize } = filters;
        const skip = (page - 1) * pageSize;

        const where: Prisma.StoreProductListingWhereInput = {};
        if (storeIds && storeIds.length > 0) {
            where.storeId = { in: storeIds };
        } else if (storeIds) {
            // If storeIds is passed but empty, it means no access
            // But logic in controller might handle this. 
            // If storeIds is undefined, it means all stores (admin)
        }

        const [total, listings] = await prisma.$transaction([
            prisma.storeProductListing.count({ where }),
            prisma.storeProductListing.findMany({
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
        const { rates: rateMap } = await getRates();

        const [totalSalesAgg, monthSalesAgg, weekSalesAgg] = await prisma.$transaction([
            prisma.salesData.groupBy({
                by: ['listingId'],
                _sum: { salesVolume: true },
                where: { listingId: { in: listingIds } },
                orderBy: { listingId: 'asc' }
            }),
            prisma.salesData.groupBy({
                by: ['listingId'],
                _sum: { salesVolume: true },
                where: { listingId: { in: listingIds }, recordDate: { gte: monthStart } },
                orderBy: { listingId: 'asc' }
            }),
            prisma.salesData.groupBy({
                by: ['listingId'],
                _sum: { salesVolume: true },
                where: { listingId: { in: listingIds }, recordDate: { gte: weekStart } },
                orderBy: { listingId: 'asc' }
            })
        ]);

        const salesMap = new Map();
        listingIds.forEach(id => salesMap.set(id, { total: 0, month: 0, week: 0 }));

        totalSalesAgg.forEach(item => {
            if (item.listingId) salesMap.get(item.listingId).total = item._sum?.salesVolume || 0;
        });
        monthSalesAgg.forEach(item => {
            if (item.listingId) salesMap.get(item.listingId).month = item._sum?.salesVolume || 0;
        });
        weekSalesAgg.forEach(item => {
            if (item.listingId) salesMap.get(item.listingId).week = item._sum?.salesVolume || 0;
        });

        const data = listings.map((listing: any) => {
            const countryCode = listing.store.countryCode;
            const currencyCode = countryCurrencyMap[countryCode] || null;
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

    async getListingOptions(allowedCountries: string[] | null) {
        const [countries, stores, products] = await Promise.all([
            prisma.managedCountry.findMany({
                where: allowedCountries ? { code: { in: allowedCountries } } : undefined,
                orderBy: { code: 'asc' },
            }),
            prisma.store.findMany({
                where: allowedCountries ? { countryCode: { in: allowedCountries } } : undefined,
                select: { id: true, name: true, countryCode: true },
                orderBy: { name: 'asc' },
            }),
            prisma.product.findMany({
                orderBy: { sku: 'asc' },
                select: { id: true, sku: true, name: true, publicName: true },
            }),
        ]);

        return {
            countries,
            stores,
            products,
            currencyMap: countryCurrencyMap,
        };
    }

    async getListingsByStore(storeId: string) {
        return await prisma.storeProductListing.findMany({
            where: { storeId },
            select: {
                id: true,
                storeTitle: true,
                productCode: true,
                storeImageUrl: true,
                product: {
                    select: {
                        id: true,
                        sku: true,
                        name: true,
                        publicName: true
                    }
                }
            },
            orderBy: { storeTitle: 'asc' }
        });
    }

    async getListingById(id: string) {
        const listing = await prisma.storeProductListing.findUnique({
            where: { id },
            include: { store: { select: { countryCode: true } } }
        });
        if (!listing) throw new AppError('未找到该上架商品', 404);
        return listing;
    }

    async createListing(data: any, file?: Express.Multer.File) {
        const payload: any = { ...data };
        if (file) {
            payload.storeImageUrl = `/uploads/listings/${file.filename}`;
        }

        const newListing = await prisma.storeProductListing.create({
            data: payload,
            include: {
                product: { select: { sku: true, publicName: true, name: true } },
                store: { include: { country: true } }
            }
        });

        const { rates } = await getRates();
        const currencyCode = countryCurrencyMap[newListing.store.countryCode] || null;
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

    async updateListing(id: string, data: any, file?: Express.Multer.File) {
        const oldListing = await prisma.storeProductListing.findUnique({
            where: { id },
            include: { store: { select: { countryCode: true } } }
        });
        if (!oldListing) {
            if (file) fs.unlinkSync(file.path);
            throw new AppError('未找到该上架商品', 404);
        }

        const payload: any = { ...data };
        if (file) {
            payload.storeImageUrl = `/uploads/listings/${file.filename}`;
            if (oldListing.storeImageUrl) {
                try {
                    const absoluteOldPath = path.join(process.cwd(), oldListing.storeImageUrl.startsWith('/') ? oldListing.storeImageUrl.slice(1) : oldListing.storeImageUrl);
                    if (fs.existsSync(absoluteOldPath)) {
                        fs.unlinkSync(absoluteOldPath);
                    }
                } catch (e) {
                    console.error("Failed to delete old image", e);
                }
            }
        }

        const updatedListing = await prisma.storeProductListing.update({
            where: { id },
            data: payload,
            include: {
                product: { select: { sku: true, publicName: true, name: true } },
                store: { include: { country: true } }
            }
        });

        return {
            ...updatedListing,
            currencyCode: countryCurrencyMap[updatedListing.store.countryCode] || null,
        };
    }

    async deleteListing(id: string) {
        const listing = await prisma.storeProductListing.findUnique({ where: { id } });
        if (!listing) throw new AppError('未找到该上架商品', 404);

        if (listing.storeImageUrl) {
            try {
                const absoluteOldPath = path.join(process.cwd(), listing.storeImageUrl.startsWith('/') ? listing.storeImageUrl.slice(1) : listing.storeImageUrl);
                if (fs.existsSync(absoluteOldPath)) {
                    fs.unlinkSync(absoluteOldPath);
                }
            } catch (e) {
                console.error("Failed to delete image", e);
            }
        }

        await prisma.storeProductListing.delete({ where: { id } });
    }
}

export default new StoreListingService();
