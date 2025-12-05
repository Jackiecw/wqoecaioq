"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dashboardService_1 = __importDefault(require("../services/dashboardService"));
class DashboardController {
    async getFilterOptions(req, res, next) {
        try {
            const data = await dashboardService_1.default.getFilterOptions(req.user);
            res.json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async getSummary(req, res, next) {
        try {
            const { countryCode, storeId } = req.query;
            // Allow optional params. Service should handle undefined.
            const summary = await dashboardService_1.default.getSummary({
                countryCode: countryCode,
                storeId: storeId
            }, req.user);
            res.json(summary);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new DashboardController();
//# sourceMappingURL=dashboardController.js.map