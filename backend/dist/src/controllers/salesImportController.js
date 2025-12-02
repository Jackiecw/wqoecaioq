"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const salesImportService_1 = __importDefault(require("../services/salesImportService"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class SalesImportController {
    constructor() {
        this.preview = async (req, res, next) => {
            try {
                if (!req.file) {
                    return next(new AppError_1.default('No file uploaded', 400));
                }
                const filePath = req.file.path;
                const platform = req.body.platform;
                const storeId = req.body.storeId;
                const result = await salesImportService_1.default.parsePreview(filePath, platform, storeId);
                res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        };
        this.confirm = async (req, res, next) => {
            try {
                const { platform, storeId, items } = req.body;
                const enteredById = req.user?.userId;
                if (!items || !Array.isArray(items)) {
                    return next(new AppError_1.default('Invalid data', 400));
                }
                if (!storeId) {
                    return next(new AppError_1.default('Store ID is required', 400));
                }
                if (!enteredById) {
                    return next(new AppError_1.default('Unauthorized: User not found', 401));
                }
                const result = await salesImportService_1.default.confirmImport(platform, storeId, items, enteredById);
                res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        };
        this.getBatches = async (req, res, next) => {
            try {
                const user = req.user;
                const result = await salesImportService_1.default.getBatches(req.query, user);
                res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        };
        this.rollback = async (req, res, next) => {
            try {
                const { id } = req.params;
                const user = req.user;
                const result = await salesImportService_1.default.rollbackBatch(id, user);
                res.status(200).json(result);
            }
            catch (error) {
                if (error instanceof Error && error.message === 'Batch not found') {
                    return next(new AppError_1.default('Batch not found', 404));
                }
                if (error instanceof Error && error.message === 'Permission denied') {
                    return next(new AppError_1.default('Permission denied', 403));
                }
                next(error);
            }
        };
    }
}
exports.default = new SalesImportController();
//# sourceMappingURL=salesImportController.js.map