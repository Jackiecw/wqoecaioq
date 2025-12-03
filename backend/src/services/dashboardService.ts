import prisma from '../../prismaClient';
import AppError from '../utils/AppError';
import {
    getStartOfToday,
    getStartOfWeek,
    getStartOfMonth,
    getRates,
    countryCurrencyMap,
    getPlanPreviewForWeek,
} from '../utils/dataHelpers';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const requireDate = (value: any, label: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new AppError(`${label}格式无效`, 400);
    }
    return date;
};

class DashboardService {
    async getFilterOptions(user: any) {
        const countries = await prisma.managedCountry.findMany({
            orderBy: { name: 'asc' },
        });

        const storeWhere =
            user.role === 'admin' || !user.operatedCountries?.length
                ? {}
                : { countryCode: { in: user.operatedCountries } };

        const stores = await prisma.store.findMany({
            where: storeWhere,
            include: { country: true },
            orderBy: { name: 'asc' },
        });

        return { countries, stores };
    }

    async getSummary(params: any, user: any) {
        const { countryCode, storeId } = params;
        if (!countryCode || !storeId) {
            throw new AppError('countryCode 和 storeId 必填', 400);
        }

        const store = await prisma.store.findUnique({
            where: { id: storeId },
            include: { country: true },
        });
        if (!store) throw new AppError('店铺不存在', 404);
        if (store.countryCode !== countryCode) {
            throw new AppError('店铺不属于所选国家', 400);
        }

        if (user.role !== 'admin') {
            const allowed = user.operatedCountries || [];
            if (!allowed.includes(store.countryCode)) {
                throw new AppError('您没有该国家的权限', 403);
            }
        }

        const { rates, lastFetched } = await getRates();
        const rateMap = rates || {};
        const targetCurrency = countryCurrencyMap[countryCode] || 'CNY';

        const toCNY = (amount: number, currency?: string | null) => {
            if (!amount) return 0;
            if (!currency || currency === 'CNY') return amount;
            const rateKey = `CNY_${currency}`;
            const rate = rateMap[rateKey];
            return rate ? amount / rate : amount;
        };

        const toTarget = (cnyAmount: number) => {
            if (targetCurrency === 'CNY') return cnyAmount;
            const rateKey = `CNY_${targetCurrency}`;
            const rate = rateMap[rateKey];
            return rate ? cnyAmount * rate : cnyAmount;
        };

        const buildRange = (start: Date, end: Date) => ({
            gte: requireDate(start, '开始时间'),
            lt: requireDate(end, '结束时间'),
        });

        const todayStart = getStartOfToday();
        const thisWeekStart = getStartOfWeek();
        const thisMonthStart = getStartOfMonth();

        const ranges = {
            today: buildRange(todayStart, new Date(todayStart.getTime() + ONE_DAY_MS)),
            week: buildRange(thisWeekStart, new Date(thisWeekStart.getTime() + 7 * ONE_DAY_MS)),
            month: buildRange(thisMonthStart, new Date(thisMonthStart.getFullYear(), thisMonthStart.getMonth() + 1, 1)),
        };

        const sumForRange = async (range: { gte: Date; lt: Date }) => {
            const rows = await prisma.salesData.findMany({
                where: { storeId, recordDate: range },
                select: { revenue: true, currency: true },
            });
            return rows.reduce((acc, row) => acc + toCNY(Number(row.revenue || 0), row.currency), 0);
        };

        const [cnyToday, cnyWeek, cnyMonth] = await Promise.all([
            sumForRange(ranges.today),
            sumForRange(ranges.week),
            sumForRange(ranges.month),
        ]);

        const gmv = {
            today: toTarget(cnyToday),
            thisWeek: toTarget(cnyWeek),
            thisMonth: toTarget(cnyMonth),
            currency: targetCurrency,
            cnyEquivalent: {
                today: cnyToday,
                thisWeek: cnyWeek,
                thisMonth: cnyMonth,
            },
        };

        const weekStart = thisWeekStart;
        const planNextWeek = await getPlanPreviewForWeek(user.userId, weekStart);
        const focus = await prisma.weeklyFocus.findUnique({
            where: { weekStartDate: weekStart },
        });

        return {
            gmv,
            schedule: {
                planNextWeek: planNextWeek || '',
                teamFocus: focus?.content || '',
            },
            ratesUpdatedAt: lastFetched,
        };
    }
}

export default new DashboardService();
