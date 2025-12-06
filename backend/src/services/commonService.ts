import prisma from '../../prismaClient';
import { getRates } from '../utils/dataHelpers';

class CommonService {
    async getCountries() {
        return await prisma.managedCountry.findMany({
            orderBy: { code: 'asc' },
        });
    }

    async getExchangeRates() {
        console.log('[DEBUG] getExchangeRates called - using getRates from dataHelpers');
        const { rates, lastFetched } = await getRates();
        console.log('[DEBUG] getRates returned:', { rates, lastFetched });
        return {
            rates,
            updatedAt: lastFetched ? new Date(lastFetched).toISOString() : new Date().toISOString()
        };
    }

    async refreshExchangeRates() {
        const { rates, lastFetched } = await getRates({ forceRefresh: true });
        return {
            rates,
            updatedAt: lastFetched ? new Date(lastFetched).toISOString() : new Date().toISOString()
        };
    }

    async getRefreshQuota() {
        return { remaining: 10 };
    }
}

export default new CommonService();
