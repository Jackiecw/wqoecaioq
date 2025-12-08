import axios from 'axios';
import prisma from '../../prismaClient';
import logger from '../utils/logger';

// --- 汇率缓存 ---
interface RatesCache {
    rates: Record<string, number> | null;
    lastFetched: number;
}

let ratesCache: RatesCache = {
    rates: null,
    lastFetched: 0,
};
const CACHE_DURATION = 1000 * 60 * 60 * 4; // 4 小时
const FALLBACK_RATES = {
    CNY_USD: 0.14,
    CNY_IDR: 2300,
    CNY_VND: 3500,
    CNY_THB: 5,
    CNY_MYR: 0.65,
    CNY_PHP: 8,
    CNY_SGD: 0.19,
};
export const currencySymbols: Record<string, string> = {
    CNY: 'CNY',
    USD: 'USD',
    IDR: 'IDR',
    VND: 'VND',
    THB: 'THB',
    MYR: 'MYR',
    PHP: 'PHP',
    SGD: 'SGD',
};
export const countryCurrencyMap: Record<string, string> = {
    ID: 'IDR',
    VN: 'VND',
    TH: 'THB',
    MY: 'MYR',
    PH: 'PHP',
    SG: 'SGD',
};

// --- 日期辅助函数 ---
export const getTimeZoneDate = () => new Date();
export const getStartOfToday = () => {
    const now = getTimeZoneDate();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};
export const getStartOfWeek = () => {
    const now = getStartOfToday();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
};
export const getStartOfMonth = () => {
    const now = getTimeZoneDate();
    return new Date(now.getFullYear(), now.getMonth(), 1);
};

/**
 * 计算延误天数（ETA 已过且未到港）
 */
export function computeShipmentDelay(eta: Date | string | null, ata: Date | string | null, today = getStartOfToday()) {
    if (!eta) {
        return { isDelayed: false, delayDays: 0 };
    }
    if (ata) {
        return { isDelayed: false, delayDays: 0 };
    }
    const etaDate = new Date(eta);
    const diffMs = today.getTime() - etaDate.getTime();
    if (diffMs <= 0) {
        return { isDelayed: false, delayDays: 0 };
    }
    const delayDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return { isDelayed: delayDays > 0, delayDays };
}

/**
 * 将整柜费用按 CBM/重量/数量 分摊给每个 shipment item
 */
export function allocateCostShare(items: any[], totalCost = 0, strategy = 'cbm') {
    if (!items || items.length === 0) {
        return [];
    }
    const key =
        strategy === 'weight' ? 'totalKg' : strategy === 'quantity' ? 'quantity' : 'totalCbm';
    const denominators = items.map((item) => {
        const value = Number(item?.[key] || 0);
        return Number.isFinite(value) && value > 0 ? value : 0;
    });
    let base = denominators.reduce((sum, v) => sum + v, 0);
    if (base <= 0) {
        // 退化为平均分摊
        base = items.length;
        return items.map((item) => ({
            id: item.id,
            share: totalCost / items.length,
        }));
    }
    return items.map((item, index) => {
        const numerator = denominators[index];
        const share = totalCost ? (totalCost * numerator) / base : 0;
        return { id: item.id, share: Number.isFinite(share) ? share : 0 };
    });
}

/**
 * 计算单件到岸成本：采购单价 + 运费分摊/件 + 关税分摊/件
 */
export function computeLandedCost(unitPrice = 0, freightShare = 0, dutyShare = 0, quantity = 0) {
    if (!quantity || quantity <= 0) {
        return unitPrice;
    }
    const perUnitFreight = freightShare / quantity;
    const perUnitDuty = dutyShare / quantity;
    return unitPrice + perUnitFreight + perUnitDuty;
}

// (依赖 prisma)
export async function getPlanPreviewForWeek(userId: string, currentWeekStart: Date) {
    const previousWeekStart = new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastReport = await prisma.weeklyReport.findFirst({
        where: {
            authorId: userId,
            weekStartDate: {
                gte: previousWeekStart,
                lt: currentWeekStart,
            },
        },
        orderBy: { createdAt: 'desc' },
        select: { planNextWeek: true },
    });
    return lastReport?.planNextWeek || null;
}

/**
 * 获取并缓存汇率，优先 API，降级使用预设汇率
 */
export async function getRates(options: { forceRefresh?: boolean } = {}) {
    const { forceRefresh = false } = options;
    const now = Date.now();
    if (!forceRefresh && ratesCache.rates && now - ratesCache.lastFetched < CACHE_DURATION) {
        logger.debug('使用缓存汇率', {
            cachedAt: new Date(ratesCache.lastFetched).toISOString(),
        });
        return {
            rates: ratesCache.rates,
            lastFetched: ratesCache.lastFetched,
        };
    }
    try {
        const apiKey = process.env.EXCHANGE_RATE_API_KEY || '64b2411accf109407c67b1b7';
        if (!apiKey) {
            logger.warn('未配置汇率 API 密钥，将使用模拟数据', {
                fallbackRates: FALLBACK_RATES,
            });
            ratesCache = {
                rates: { ...FALLBACK_RATES },
                lastFetched: now,
            };
            return {
                rates: ratesCache.rates,
                lastFetched: ratesCache.lastFetched,
            };
        }

        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/CNY`, {
            timeout: 5000, // 5 seconds timeout
        });

        if (response.data && response.data.result === 'success') {
            const rates = response.data.conversion_rates;
            ratesCache = {
                rates: {
                    CNY_USD: rates.USD,
                    CNY_IDR: rates.IDR,
                    CNY_VND: rates.VND,
                    CNY_THB: rates.THB,
                    CNY_MYR: rates.MYR,
                    CNY_PHP: rates.PHP,
                    CNY_SGD: rates.SGD,
                },
                lastFetched: now,
            };
            logger.info('汇率缓存已更新', {
                fetchedAt: new Date(now).toISOString(),
                forceRefresh,
                rates: ratesCache.rates,
            });
            return {
                rates: ratesCache.rates,
                lastFetched: ratesCache.lastFetched,
            };
        }

        throw new Error('汇率 API 响应失败');
    } catch (error: any) {
        logger.error('获取汇率失败', { message: error.message, stack: error.stack });
        if (ratesCache.rates) {
            return {
                rates: ratesCache.rates,
                lastFetched: ratesCache.lastFetched,
            };
        }
        ratesCache = {
            rates: { ...FALLBACK_RATES },
            lastFetched: now,
        };
        logger.warn('汇率 API 调用失败，使用备用汇率', {
            fallbackRates: FALLBACK_RATES,
        });
        return {
            rates: ratesCache.rates,
            lastFetched: ratesCache.lastFetched,
        };
    }
}
