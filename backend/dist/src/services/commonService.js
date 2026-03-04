"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const dataHelpers_1 = require("../utils/dataHelpers");
class CommonService {
    async getCountries() {
        return await prismaClient_1.default.managedCountry.findMany({
            orderBy: { code: 'asc' },
        });
    }
    async getExchangeRates() {
        console.log('[DEBUG] getExchangeRates called - using getRates from dataHelpers');
        const { rates, lastFetched } = await (0, dataHelpers_1.getRates)();
        console.log('[DEBUG] getRates returned:', { rates, lastFetched });
        return {
            rates,
            updatedAt: lastFetched ? new Date(lastFetched).toISOString() : new Date().toISOString()
        };
    }
    async refreshExchangeRates() {
        const { rates, lastFetched } = await (0, dataHelpers_1.getRates)({ forceRefresh: true });
        return {
            rates,
            updatedAt: lastFetched ? new Date(lastFetched).toISOString() : new Date().toISOString()
        };
    }
    async getRefreshQuota() {
        return { remaining: 10 };
    }
}
exports.default = new CommonService();
//# sourceMappingURL=commonService.js.map