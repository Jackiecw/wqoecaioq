"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsController = void 0;
const logisticsService_1 = __importDefault(require("../services/logisticsService"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../utils/AppError"));
// --- Zod Schemas ---
const orderCreateSchema = zod_1.z.object({
    orderDate: zod_1.z.coerce.date({ message: '订单日期无效' }),
    productId: zod_1.z.string().min(1, '必须选择产品'),
    skuName: zod_1.z.string().min(1, 'SKU 名称必填'),
    productColor: zod_1.z.string().min(1, '产品颜色必填'),
    productSpec: zod_1.z.string().min(1, '产品规格必填'),
    salesRegion: zod_1.z.string().min(1, '销售地必填'),
    plugSpec: zod_1.z.string().min(1, '插头规格必填'),
    quantity: zod_1.z.coerce.number().int().min(1, '数量必须大于 0'),
    unitPrice: zod_1.z.coerce.number().min(0),
    totalPrice: zod_1.z.coerce.number().min(0),
    outboundDate: zod_1.z.coerce.date().optional().nullable(),
    logisticsProvider: zod_1.z.string().optional().nullable(),
    logisticsUnitPrice: zod_1.z.coerce.number().min(0).optional().nullable(),
    warehousingProvider: zod_1.z.string().optional().nullable(),
    cartonCount: zod_1.z.coerce.number().int().min(0).optional().nullable(),
    totalCbm: zod_1.z.coerce.number().min(0).optional().nullable(),
    totalKg: zod_1.z.coerce.number().min(0).optional().nullable(),
    billingCbm: zod_1.z.coerce.number().min(0).optional().nullable(),
    billingKg: zod_1.z.coerce.number().min(0).optional().nullable(),
    billingMethod: zod_1.z.nativeEnum(client_1.LogisticsBillingMethod).optional().nullable(),
    logisticsFee: zod_1.z.coerce.number().min(0).optional().nullable(),
    warehouseDate: zod_1.z.coerce.date().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
});
const batchCreateSchema = zod_1.z.object({
    countryCode: zod_1.z.string().min(2, '销售国家代码必填'),
    notes: zod_1.z.string().optional().nullable(),
    orders: zod_1.z.array(orderCreateSchema).min(1, '至少需要 1 条订单'),
});
const appendOrderSchema = zod_1.z.object({
    batchId: zod_1.z.string().min(1, '必须选择批次'),
    orders: zod_1.z.array(orderCreateSchema).min(1, '至少需要 1 条订单'),
});
const statusUpdateSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.ProductionOrderStatus),
    occurredAt: zod_1.z.coerce.date({ message: '日期无效' }),
});
const batchStatusUpdateSchema = zod_1.z.object({
    orderIds: zod_1.z.array(zod_1.z.string()).min(1, "至少选择一个订单"),
    status: zod_1.z.nativeEnum(client_1.ProductionOrderStatus),
    occurredAt: zod_1.z.coerce.date({ message: '日期无效' }),
});
const orderUpdateSchema = zod_1.z.object({
    logisticsProvider: zod_1.z.string().optional().nullable(),
    logisticsUnitPrice: zod_1.z.coerce.number().min(0).optional().nullable(),
    warehousingProvider: zod_1.z.string().optional().nullable(),
    cartonCount: zod_1.z.coerce.number().int().min(0).optional().nullable(),
    totalCbm: zod_1.z.coerce.number().min(0).optional().nullable(),
    totalKg: zod_1.z.coerce.number().min(0).optional().nullable(),
    billingCbm: zod_1.z.coerce.number().min(0).optional().nullable(),
    billingKg: zod_1.z.coerce.number().min(0).optional().nullable(),
    billingMethod: zod_1.z.nativeEnum(client_1.LogisticsBillingMethod).optional().nullable(),
    logisticsFee: zod_1.z.coerce.number().min(0).optional().nullable(),
    outboundDate: zod_1.z.coerce.date().optional().nullable(),
    warehouseDate: zod_1.z.coerce.date().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
    quantity: zod_1.z.coerce.number().int().min(1).optional(),
    unitPrice: zod_1.z.coerce.number().min(0).optional(),
    totalPrice: zod_1.z.coerce.number().min(0).optional(),
});
class LogisticsController {
    async getBatches(req, res, next) {
        try {
            const result = await logisticsService_1.default.getBatches();
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getOrders(req, res, next) {
        try {
            const result = await logisticsService_1.default.getOrders(req.query);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async exportOrders(req, res, next) {
        try {
            const buffer = await logisticsService_1.default.exportOrders(req.query);
            res.setHeader('Content-Disposition', `attachment; filename="logistics_export_${Date.now()}.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        }
        catch (error) {
            next(error);
        }
    }
    async getOrderDetail(req, res, next) {
        try {
            const detail = await logisticsService_1.default.getOrderDetail(req.params.id);
            if (!detail) {
                throw new AppError_1.default('订单不存在', 404);
            }
            res.json(detail);
        }
        catch (error) {
            next(error);
        }
    }
    async createBatch(req, res, next) {
        try {
            const validation = batchCreateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const { userId } = req.user;
            const result = await logisticsService_1.default.createBatch(validation.data, userId);
            res.status(201).json(result);
        }
        catch (error) {
            if (error.code === 'PRODUCT_NOT_FOUND') {
                return next(new AppError_1.default(error.message, 400));
            }
            if (error.code === 'P2002') {
                return next(new AppError_1.default('批次或订单编号重复，请重试', 400));
            }
            next(error);
        }
    }
    async appendOrders(req, res, next) {
        try {
            const validation = appendOrderSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const { userId } = req.user;
            const result = await logisticsService_1.default.appendOrders(validation.data, userId);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async updateOrderStatus(req, res, next) {
        try {
            const validation = statusUpdateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const { userId } = req.user;
            const result = await logisticsService_1.default.updateOrderStatus(req.params.id, validation.data, userId);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async batchUpdateOrderStatus(req, res, next) {
        try {
            const validation = batchStatusUpdateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const { userId } = req.user;
            const result = await logisticsService_1.default.batchUpdateOrderStatus(validation.data, userId);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async updateOrder(req, res, next) {
        try {
            const validation = orderUpdateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const result = await logisticsService_1.default.updateOrder(req.params.id, validation.data);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteOrder(req, res, next) {
        try {
            await logisticsService_1.default.deleteOrder(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    async deleteBatch(req, res, next) {
        try {
            await logisticsService_1.default.deleteBatch(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.LogisticsController = LogisticsController;
exports.default = new LogisticsController();
//# sourceMappingURL=logisticsController.js.map