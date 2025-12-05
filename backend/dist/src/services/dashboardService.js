"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const dataHelpers_1 = require("../utils/dataHelpers");
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const requireDate = (value, label) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new AppError_1.default(`${label}格式无效`, 400);
    }
    return date;
};
class DashboardService {
    async getFilterOptions(user) {
        const countries = await prismaClient_1.default.managedCountry.findMany({
            orderBy: { name: 'asc' },
        });
        const storeWhere = user.role === 'admin' || !user.operatedCountries?.length
            ? {}
            : { countryCode: { in: user.operatedCountries } };
        const stores = await prismaClient_1.default.store.findMany({
            where: storeWhere,
            include: { country: true },
            orderBy: { name: 'asc' },
        });
        return { countries, stores };
    }
    async getSummary(params, user) {
        const { countryCode, storeId } = params;
        // Default zeroed GMV
        let gmv = {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            currency: 'CNY',
            cnyEquivalent: { today: 0, thisWeek: 0, thisMonth: 0 },
        };
        if (storeId && countryCode) {
            const store = await prismaClient_1.default.store.findUnique({
                where: { id: storeId },
                include: { country: true },
            });
            if (!store)
                throw new AppError_1.default('店铺不存在', 404);
            if (store.countryCode !== countryCode) {
                throw new AppError_1.default('店铺不属于所选国家', 400);
            }
            if (user.role !== 'admin') {
                const allowed = user.operatedCountries || [];
                if (!allowed.includes(store.countryCode)) {
                    throw new AppError_1.default('您没有该国家的权限', 403);
                }
            }
            const { rates } = await (0, dataHelpers_1.getRates)();
            const rateMap = rates || {};
            const targetCurrency = dataHelpers_1.countryCurrencyMap[countryCode] || 'CNY';
            const toCNY = (amount, currency) => {
                if (!amount)
                    return 0;
                if (!currency || currency === 'CNY')
                    return amount;
                const rateKey = `CNY_${currency}`;
                const rate = rateMap[rateKey];
                return rate ? amount / rate : amount;
            };
            const toTarget = (cnyAmount) => {
                if (targetCurrency === 'CNY')
                    return cnyAmount;
                const rateKey = `CNY_${targetCurrency}`;
                const rate = rateMap[rateKey];
                return rate ? cnyAmount * rate : cnyAmount;
            };
            const buildRange = (start, end) => ({
                gte: requireDate(start, '开始时间'),
                lt: requireDate(end, '结束时间'),
            });
            const todayStart = (0, dataHelpers_1.getStartOfToday)();
            const thisWeekStart = (0, dataHelpers_1.getStartOfWeek)();
            const thisMonthStart = (0, dataHelpers_1.getStartOfMonth)();
            const ranges = {
                today: buildRange(todayStart, new Date(todayStart.getTime() + ONE_DAY_MS)),
                week: buildRange(thisWeekStart, new Date(thisWeekStart.getTime() + 7 * ONE_DAY_MS)),
                month: buildRange(thisMonthStart, new Date(thisMonthStart.getFullYear(), thisMonthStart.getMonth() + 1, 1)),
            };
            const sumForRange = async (range) => {
                const rows = await prismaClient_1.default.salesData.findMany({
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
            gmv = {
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
        }
        const { lastFetched } = await (0, dataHelpers_1.getRates)();
        const thisWeekStart = (0, dataHelpers_1.getStartOfWeek)();
        const planNextWeek = await (0, dataHelpers_1.getPlanPreviewForWeek)(user.userId, thisWeekStart);
        const focus = await prismaClient_1.default.weeklyFocus.findUnique({
            where: { weekStartDate: thisWeekStart },
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
exports.default = new DashboardService();
//# sourceMappingURL=dashboardService.js.map