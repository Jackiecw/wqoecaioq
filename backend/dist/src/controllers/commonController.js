"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commonService_1 = __importDefault(require("../services/commonService"));
const salesService_1 = __importDefault(require("../services/salesService"));
class CommonController {
    async getCountries(req, res, next) {
        try {
            const countries = await commonService_1.default.getCountries();
            res.json(countries);
        }
        catch (error) {
            next(error);
        }
    }
    async getStores(req, res, next) {
        try {
            // Reuse salesService logic for filtering stores by user permissions
            const stores = await salesService_1.default.getStoresList(req.user);
            res.json(stores);
        }
        catch (error) {
            next(error);
        }
    }
    async getExchangeRates(req, res, next) {
        try {
            const data = await commonService_1.default.getExchangeRates();
            res.json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async refreshExchangeRates(req, res, next) {
        try {
            const data = await commonService_1.default.refreshExchangeRates();
            res.json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async getRefreshQuota(req, res, next) {
        try {
            const data = await commonService_1.default.getRefreshQuota();
            res.json(data);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new CommonController();
//# sourceMappingURL=commonController.js.map