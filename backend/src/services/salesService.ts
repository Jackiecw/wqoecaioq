import prisma from '../../prismaClient';
import AppError from '../utils/AppError';
import { getRates, countryCurrencyMap, currencySymbols } from '../utils/dataHelpers';
import { z } from 'zod';

const SALES_SORTABLE_FIELDS = new Set(['recordDate', 'salesVolume', 'revenue', 'createdAt']);
const SALES_DATE_RANGE_BUFFER_DAYS = 1;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

const salesDataInclude = {
    store: { include: { country: true } },
    product: { select: { sku: true, name: true } },
    listing: { select: { productCode: true, storeTitle: true } },
    enteredBy: { select: { nickname: true } },
};

// Helpers
const asNumber = (value: any, fallback: number) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return parsed;
};

export function normalizePagination(query: any) {
    const page = Math.max(DEFAULT_PAGE, asNumber(query.page, DEFAULT_PAGE));
    const requestedSize = asNumber(query.pageSize, DEFAULT_PAGE_SIZE);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requestedSize));
    return {
        page,
        pageSize,
        skip: (page - 1) * pageSize,
    };
}

export function buildRecordDateFilter(startDate: string | undefined, endDate: string | undefined) {
    if (!startDate && !endDate) return null;

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if ((startDate && Number.isNaN(start?.getTime())) || (endDate && Number.isNaN(end?.getTime()))) {
        return null;
    }

    if (start && end) {
        const endBoundary = new Date(end.getTime());
        endBoundary.setDate(endBoundary.getDate() + SALES_DATE_RANGE_BUFFER_DAYS);
        endBoundary.setHours(0, 0, 0, 0);
        return { gte: start, lt: endBoundary };
    }

    if (start) return { gte: start };

    if (end) {
        const endBoundary = new Date(end.getTime());
        endBoundary.setDate(endBoundary.getDate() + SALES_DATE_RANGE_BUFFER_DAYS);
        endBoundary.setHours(0, 0, 0, 0);
        return { lt: endBoundary };
    }
    return null;
}

export function buildSalesDataWhere(query: any, user: any) {
    const where: any = {};

    // 1. Base Permissions
    if (user.role !== 'admin') {
        const permissionConditions = [];

        // Rule 1: Managers can view all records for their supervised countries
        const supervisedCountries = user.supervisedCountries || [];
        if (supervisedCountries.length > 0) {
            const supervisedCodes = user.supervisedCountries.map((c: any) => c.code || c); // Handle both object and string if needed
            if (supervisedCodes.length > 0) {
                permissionConditions.push({
                    store: { countryCode: { in: supervisedCodes } }
                });
            }
        }

        // Rule 2: View own records
        permissionConditions.push({
            enteredById: user.userId
        });

        // Combine with OR
        if (where.AND) {
            where.AND.push({ OR: permissionConditions });
        } else {
            where.AND = [{ OR: permissionConditions }];
        }
    }

    // 2. Apply Filters
    if (query.countryCode) {
        where.store = { ...where.store, countryCode: query.countryCode };
    }

    if (query.platform) {
        where.store = { ...where.store, platform: query.platform };
    }

    if (query.storeId) {
        where.storeId = query.storeId;
    }

    if (query.search) {
        where.platformOrderId = { contains: query.search };
    }

    const recordDateFilter = buildRecordDateFilter(query.startDate, query.endDate);
    if (recordDateFilter) {
        where.recordDate = recordDateFilter;
    }

    return { where };
}

export function buildSalesDataOrder(query: any) {
    const sortBy = query.sortBy && SALES_SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : 'recordDate';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [sortBy]: sortOrder };
}

export function appendManagePermission(rows: any[], supervisedCountries: any[] = [], isAdmin = false) {
    const supervised = supervisedCountries || [];
    return rows.map((row) => ({
        ...row,
        canManage: isAdmin || supervised.includes(row.store.countryCode),
    }));
}

class SalesService {
    async create(data: any, userId: string) {
        const { recordDate, storeId, productId, listingId, salesVolume, revenue, currency, notes, platformOrderId, orderStatus } = data;

        const store = await prisma.store.findUnique({
            where: { id: storeId },
            select: { platform: true }
        });

        if (!store) {
            throw new AppError('Invalid Store ID', 400);
        }

        const importBatch = await prisma.importBatch.create({
            data: {
                platform: store.platform,
                fileName: `Manual Import - ${new Date().toISOString().split('T')[0]}`,
                importedById: userId
            }
        });

        try {
            return await prisma.salesData.create({
                data: {
                    recordDate: new Date(recordDate),
                    salesVolume,
                    revenue,
                    currency,
                    notes: notes || null,
                    platformOrderId: platformOrderId || null,
                    orderStatus: orderStatus || null,
                    enteredById: userId,
                    storeId,
                    productId,
                    listingId: listingId || null,
                    importBatchId: importBatch.id,
                    platform: store.platform, // Add platform from store
                },
            });
        } catch (error: any) {
            if (error.code === 'P2003') {
                throw new AppError('提交失败：所选的店铺、商品或链接无效', 400);
            }
            throw error;
        }
    }

    async findAll(query: any, user: any) {
        const { role, supervisedCountries = [] } = user;
        const { where } = buildSalesDataWhere(query, user);
        const orderBy = buildSalesDataOrder(query);
        const { page, pageSize, skip } = normalizePagination(query);

        const [total, salesData] = await prisma.$transaction([
            prisma.salesData.count({ where }),
            prisma.salesData.findMany({
                where,
                orderBy,
                skip,
                take: pageSize,
                include: salesDataInclude,
            }),
        ]);

        const supervisedCodes = supervisedCountries.map((c: any) => c.code || c);
        const formattedData = appendManagePermission(salesData, supervisedCodes, role === 'admin');

        return {
            data: formattedData,
            total,
            page,
            pageSize,
        };
    }

    async checkPermission(userId: string, salesDataId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: { select: { name: true } },
                supervisedCountries: { select: { code: true } },
            },
        });

        if (!user) throw new AppError('用户未找到', 404);
        if (user.role.name === 'admin') return true;

        const data = await prisma.salesData.findUnique({
            where: { id: salesDataId },
            include: { store: { select: { countryCode: true } } },
        });

        if (!data) throw new AppError('数据未找到', 404);

        if (data.enteredById === userId) return true;

        const supervisedCodes = user.supervisedCountries.map((c) => c.code);
        if (supervisedCodes.includes(data.store.countryCode)) return true;

        throw new AppError('权限不足：您只能管理自己录入的数据或主管国家的数据', 403);
    }

    async update(id: string, data: any, userId: string) {
        await this.checkPermission(userId, id);

        const { recordDate, storeId, productId, listingId, salesVolume, revenue, currency, notes, platformOrderId, orderStatus } = data;

        try {
            const updated = await prisma.salesData.update({
                where: { id },
                data: {
                    recordDate: new Date(recordDate),
                    storeId,
                    productId,
                    listingId: listingId || null,
                    salesVolume,
                    revenue,
                    currency,
                    notes: notes || null,
                    platformOrderId: platformOrderId || null,
                    orderStatus: orderStatus || null,
                },
                include: salesDataInclude,
            });

            return { ...updated, canManage: true };
        } catch (error: any) {
            if (error.code === 'P2003') throw new AppError('更新失败：所选的店铺、商品或链接无效', 400);
            if (error.code === 'P2025') throw new AppError('数据未找到', 404);
            throw error;
        }
    }

    async delete(id: string, userId: string) {
        await this.checkPermission(userId, id);

        try {
            await prisma.salesData.delete({ where: { id } });
        } catch (error: any) {
            if (error.code === 'P2025') throw new AppError('数据未找到', 404);
            throw error;
        }
    }

    async getStats(query: any, user: any) {
        const { role, supervisedCountries = [] } = user;
        const { startDate, endDate, countryCode, platform, storeId } = query;

        let targetCurrency = 'CNY';
        if (countryCode && countryCode !== 'ALL') {
            const currencyCode = countryCurrencyMap[countryCode];
            if (currencyCode) {
                targetCurrency = currencySymbols[currencyCode] || currencyCode;
            }
        }

        const { rates } = await getRates();
        const safeRates = rates || {}; // Handle null rates

        const toCNY = (amount: number, currency: string | null) => {
            if (!amount) return 0;
            if (currency === 'CNY' || !currency) return amount;
            const rateKey = `CNY_${currency}`;
            const rate = safeRates[rateKey];
            if (rate) return amount / rate;
            return 0;
        };

        const currentStart = new Date(startDate);
        const currentEnd = new Date(endDate);
        const duration = currentEnd.getTime() - currentStart.getTime();
        const previousEnd = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
        const previousStart = new Date(previousEnd.getTime() - duration);

        const buildWhere = (start: Date, end: Date) => {
            const where: any = {};

            if (role !== 'admin') {
                const permissionConditions = [];
                const supervisedCodes = supervisedCountries.map((c: any) => c.code || c);
                if (supervisedCodes.length > 0) {
                    permissionConditions.push({ store: { countryCode: { in: supervisedCodes } } });
                }
                permissionConditions.push({ enteredById: user.userId });
                where.AND = [{ OR: permissionConditions }];
            }

            const storeFilter: any = {};
            if (countryCode && countryCode !== 'ALL') storeFilter.countryCode = countryCode;
            if (platform) storeFilter.platform = platform;
            if (Object.keys(storeFilter).length > 0) {
                where.store = { ...where.store, ...storeFilter };
            }
            if (storeId) where.storeId = storeId;

            const recordDateFilter = buildRecordDateFilter(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
            if (recordDateFilter) where.recordDate = recordDateFilter;

            return where;
        };

        const currentWhere = buildWhere(currentStart, currentEnd);
        const previousWhere = buildWhere(previousStart, previousEnd);

        const fetchData = async (where: any) => {
            return prisma.salesData.findMany({
                where,
                select: {
                    recordDate: true,
                    salesVolume: true,
                    revenue: true,
                    currency: true,
                    store: {
                        select: {
                            name: true,
                            platform: true,
                            country: { select: { code: true, name: true } }
                        }
                    },
                    product: { select: { sku: true } }
                }
            });
        };

        const [currentData, previousData] = await Promise.all([
            fetchData(currentWhere),
            fetchData(previousWhere)
        ]);

        const aggregate = (data: any[]) => {
            let totalGMV_CNY = 0;
            let totalOrders = 0;
            const trendMap: any = {};
            const platformMap: any = {};
            const countryMap: any = {};
            const storeMap: any = {};
            const productMap: any = {};

            data.forEach(row => {
                const cnyAmount = toCNY(row.revenue, row.currency);
                const orders = row.salesVolume || 0;

                totalGMV_CNY += cnyAmount;
                totalOrders += orders;

                const dateKey = row.recordDate.toISOString().split('T')[0];
                if (!trendMap[dateKey]) trendMap[dateKey] = { date: dateKey, gmv: 0, orders: 0 };
                trendMap[dateKey].gmv += cnyAmount;
                trendMap[dateKey].orders += orders;

                const platform = row.store.platform;
                if (!platformMap[platform]) platformMap[platform] = 0;
                platformMap[platform] += cnyAmount;

                const country = row.store.country;
                if (country) {
                    if (!countryMap[country.code]) countryMap[country.code] = { name: country.name, gmv: 0 };
                    countryMap[country.code].gmv += cnyAmount;
                }

                const storeName = row.store.name;
                if (!storeMap[storeName]) storeMap[storeName] = 0;
                storeMap[storeName] += cnyAmount;

                const sku = row.product.sku;
                if (!productMap[sku]) productMap[sku] = 0;
                productMap[sku] += orders;
            });

            return { totalGMV_CNY, totalOrders, trendMap, platformMap, countryMap, storeMap, productMap };
        };

        const currentStats = aggregate(currentData);
        const previousStats = aggregate(previousData);

        const calculateGrowth = (current: number, previous: number) => {
            if (!previous || previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        const currentAOV_CNY = currentStats.totalOrders > 0 ? currentStats.totalGMV_CNY / currentStats.totalOrders : 0;
        const previousAOV_CNY = previousStats.totalOrders > 0 ? previousStats.totalGMV_CNY / previousStats.totalOrders : 0;

        const summary: any = {
            totalGMV: currentStats.totalGMV_CNY,
            totalOrders: currentStats.totalOrders,
            aov: currentAOV_CNY,
            gmvGrowth: calculateGrowth(currentStats.totalGMV_CNY, previousStats.totalGMV_CNY),
            ordersGrowth: calculateGrowth(currentStats.totalOrders, previousStats.totalOrders),
            aovGrowth: calculateGrowth(currentAOV_CNY, previousAOV_CNY),
            currency: 'CNY',
            cnyTotalGMV: currentStats.totalGMV_CNY
        };

        if (countryCode && countryCode !== 'ALL') {
            const rateKey = `CNY_${targetCurrency}`;
            const rate = safeRates[rateKey];
            if (rate) {
                summary.totalGMV = currentStats.totalGMV_CNY * rate;
                summary.aov = currentAOV_CNY * rate;
                summary.currency = targetCurrency;
            }
        }

        const convertToTarget = (cnyAmount: number) => {
            if (summary.currency === 'CNY') return cnyAmount;
            const rateKey = `CNY_${summary.currency}`;
            const rate = safeRates[rateKey];
            return rate ? cnyAmount * rate : cnyAmount;
        };

        const trend = Object.values(currentStats.trendMap)
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((item: any) => ({ ...item, gmv: convertToTarget(item.gmv) }));

        const byPlatform = Object.entries(currentStats.platformMap)
            .map(([platform, gmv]: [string, any]) => ({ platform, gmv: convertToTarget(gmv) }))
            .sort((a, b) => b.gmv - a.gmv);

        const byCountry = Object.entries(currentStats.countryMap)
            .map(([code, data]: [string, any]) => ({ code, name: data.name, gmv: convertToTarget(data.gmv) }))
            .sort((a, b) => b.gmv - a.gmv);

        const topStores = Object.entries(currentStats.storeMap)
            .map(([name, gmv]: [string, any]) => ({ name, gmv: convertToTarget(gmv) }))
            .sort((a, b) => b.gmv - a.gmv)
            .slice(0, 5);

        const topProducts = Object.entries(currentStats.productMap)
            .map(([sku, volume]: [string, any]) => ({ sku, volume }))
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5);

        return {
            summary,
            trend,
            byPlatform,
            byCountry,
            topStores,
            topProducts
        };
    }
    async getStoresList(user: any) {
        const { role, operatedCountries = [] } = user;
        const where: any = {};

        if (role !== 'admin') {
            const operatedCodes = operatedCountries.map((c: any) => c.code || c);
            where.countryCode = { in: operatedCodes };
        }

        return await prisma.store.findMany({
            where,
            include: { country: true },
            orderBy: { name: 'asc' }
        });
    }
}

export default new SalesService();
