"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const salesService_1 = __importDefault(require("../services/salesService"));
const zod_1 = require("zod");
const salesDataSchema = zod_1.z.object({
    recordDate: zod_1.z.string().date('日期格式无效'),
    storeId: zod_1.z.string().min(1),
    productId: zod_1.z.string().min(1),
    listingId: zod_1.z.string().optional().nullable(),
    salesVolume: zod_1.z.number().int().min(0),
    revenue: zod_1.z.number().min(0),
    currency: zod_1.z.string().default('CNY'),
    notes: zod_1.z.string().optional().nullable(),
    platformOrderId: zod_1.z.string().optional().nullable(),
    orderStatus: zod_1.z.string().optional().nullable(),
});
class SalesController {
    async create(req, res, next) {
        try {
            const validation = salesDataSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: '输入数据无效',
                    details: validation.error.errors,
                });
            }
            const result = await salesService_1.default.create(validation.data, req.user.userId);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async findAll(req, res, next) {
        try {
            const result = await salesService_1.default.findAll(req.query, req.user);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const validation = salesDataSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: '输入数据无效',
                    details: validation.error.errors,
                });
            }
            const result = await salesService_1.default.update(req.params.id, validation.data, req.user.userId);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            await salesService_1.default.delete(req.params.id, req.user.userId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    async getStats(req, res, next) {
        try {
            const result = await salesService_1.default.getStats(req.query, req.user);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new SalesController();
//# sourceMappingURL=salesController.js.map