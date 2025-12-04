import prisma from '../../prismaClient';

const DEFAULT_RATES = {
    CNY_USD: 0.138,
    CNY_IDR: 2200,
    CNY_VND: 3450,
    CNY_THB: 4.8,
    CNY_MYR: 0.65,
    CNY_PHP: 7.8,
    CNY_SGD: 0.185,
};

class CommonService {
    async getCountries() {
        return await prisma.managedCountry.findMany({
            orderBy: { code: 'asc' },
        });
    }

    async getExchangeRates() {
        // TODO: Implement DB storage for rates
        return {
            rates: DEFAULT_RATES,
            updatedAt: new Date().toISOString()
        };
    }

    async refreshExchangeRates() {
        // TODO: Implement actual fetching
        return {
            rates: DEFAULT_RATES,
            updatedAt: new Date().toISOString()
        };
    }

    async getRefreshQuota() {
        return { remaining: 10 };
    }
}

export default new CommonService();
