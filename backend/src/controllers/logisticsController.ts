import { Request, Response, NextFunction } from 'express';
import logisticsService from '../services/logisticsService';
import { z } from 'zod';
import { ProductionOrderStatus, LogisticsBillingMethod } from '@prisma/client';
import AppError from '../utils/AppError';

// --- Zod Schemas ---
const orderCreateSchema = z.object({
    orderDate: z.coerce.date({ message: '订单日期无效' }),
    productId: z.string().min(1, '必须选择产品'),
    skuName: z.string().min(1, 'SKU 名称必填'),
    productColor: z.string().min(1, '产品颜色必填'),
    productSpec: z.string().min(1, '产品规格必填'),
    salesRegion: z.string().min(1, '销售地必填'),
    plugSpec: z.string().min(1, '插头规格必填'),
    quantity: z.coerce.number().int().min(1, '数量必须大于 0'),
    unitPrice: z.coerce.number().min(0),
    totalPrice: z.coerce.number().min(0),
    outboundDate: z.coerce.date().optional().nullable(),
    logisticsProvider: z.string().optional().nullable(),
    logisticsUnitPrice: z.coerce.number().min(0).optional().nullable(),
    warehousingProvider: z.string().optional().nullable(),
    cartonCount: z.coerce.number().int().min(0).optional().nullable(),
    totalCbm: z.coerce.number().min(0).optional().nullable(),
    totalKg: z.coerce.number().min(0).optional().nullable(),
    billingCbm: z.coerce.number().min(0).optional().nullable(),
    billingKg: z.coerce.number().min(0).optional().nullable(),
    billingMethod: z.nativeEnum(LogisticsBillingMethod).optional().nullable(),
    logisticsFee: z.coerce.number().min(0).optional().nullable(),
    warehouseDate: z.coerce.date().optional().nullable(),
    notes: z.string().optional().nullable(),
});

const batchCreateSchema = z.object({
    countryCode: z.string().min(2, '销售国家代码必填'),
    notes: z.string().optional().nullable(),
    orders: z.array(orderCreateSchema).min(1, '至少需要 1 条订单'),
});

const appendOrderSchema = z.object({
    batchId: z.string().min(1, '必须选择批次'),
    orders: z.array(orderCreateSchema).min(1, '至少需要 1 条订单'),
});

const statusUpdateSchema = z.object({
    status: z.nativeEnum(ProductionOrderStatus),
    occurredAt: z.coerce.date({ message: '日期无效' }),
});

const batchStatusUpdateSchema = z.object({
    orderIds: z.array(z.string()).min(1, "至少选择一个订单"),
    status: z.nativeEnum(ProductionOrderStatus),
    occurredAt: z.coerce.date({ message: '日期无效' }),
});

const orderUpdateSchema = z.object({
    logisticsProvider: z.string().optional().nullable(),
    logisticsUnitPrice: z.coerce.number().min(0).optional().nullable(),
    warehousingProvider: z.string().optional().nullable(),
    cartonCount: z.coerce.number().int().min(0).optional().nullable(),
    totalCbm: z.coerce.number().min(0).optional().nullable(),
    totalKg: z.coerce.number().min(0).optional().nullable(),
    billingCbm: z.coerce.number().min(0).optional().nullable(),
    billingKg: z.coerce.number().min(0).optional().nullable(),
    billingMethod: z.nativeEnum(LogisticsBillingMethod).optional().nullable(),
    logisticsFee: z.coerce.number().min(0).optional().nullable(),
    outboundDate: z.coerce.date().optional().nullable(),
    warehouseDate: z.coerce.date().optional().nullable(),
    notes: z.string().optional().nullable(),
    quantity: z.coerce.number().int().min(1).optional(),
    unitPrice: z.coerce.number().min(0).optional(),
    totalPrice: z.coerce.number().min(0).optional(),
});

export class LogisticsController {
    async getBatches(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await logisticsService.getBatches();
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getOrders(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await logisticsService.getOrders(req.query);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async exportOrders(req: Request, res: Response, next: NextFunction) {
        try {
            const buffer = await logisticsService.exportOrders(req.query);
            res.setHeader('Content-Disposition', `attachment; filename="logistics_export_${Date.now()}.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }

    async getOrderDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const detail = await logisticsService.getOrderDetail(req.params.id);
            if (!detail) {
                throw new AppError('订单不存在', 404);
            }
            res.json(detail);
        } catch (error) {
            next(error);
        }
    }

    async createBatch(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = batchCreateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const { userId } = (req as any).user;
            const result = await logisticsService.createBatch(validation.data, userId);
            res.status(201).json(result);
        } catch (error: any) {
            if (error.code === 'PRODUCT_NOT_FOUND') {
                return next(new AppError(error.message, 400));
            }
            if (error.code === 'P2002') {
                return next(new AppError('批次或订单编号重复，请重试', 400));
            }
            next(error);
        }
    }

    async appendOrders(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = appendOrderSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const { userId } = (req as any).user;
            const result = await logisticsService.appendOrders(validation.data, userId);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = statusUpdateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const { userId } = (req as any).user;
            const result = await logisticsService.updateOrderStatus(req.params.id, validation.data, userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async batchUpdateOrderStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = batchStatusUpdateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const { userId } = (req as any).user;
            const result = await logisticsService.batchUpdateOrderStatus(validation.data, userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async updateOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = orderUpdateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const result = await logisticsService.updateOrder(req.params.id, validation.data);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async deleteOrder(req: Request, res: Response, next: NextFunction) {
        try {
            await logisticsService.deleteOrder(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async deleteBatch(req: Request, res: Response, next: NextFunction) {
        try {
            await logisticsService.deleteBatch(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new LogisticsController();
