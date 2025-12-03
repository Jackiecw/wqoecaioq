"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dashboardService_1 = __importDefault(require("../services/dashboardService"));
const AppError_1 = __importDefault(require("../utils/AppError"));
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
            if (!countryCode || !storeId) {
                throw new AppError_1.default('countryCode 和 storeId 必填', 400);
            }
            const summary = await dashboardService_1.default.getSummary({ countryCode, storeId }, req.user);
            res.json(summary);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new DashboardController();
//# sourceMappingURL=dashboardController.js.map