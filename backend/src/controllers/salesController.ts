import { Request, Response, NextFunction } from 'express';
import salesService from '../services/salesService';
import { z } from 'zod';

const salesDataSchema = z.object({
    recordDate: z.string().date('日期格式无效'),
    storeId: z.string().min(1),
    productId: z.string().min(1),
    listingId: z.string().optional().nullable(),
    salesVolume: z.number().int().min(0),
    revenue: z.number().min(0),
    currency: z.string().default('CNY'),
    notes: z.string().optional().nullable(),
    platformOrderId: z.string().optional().nullable(),
    orderStatus: z.string().optional().nullable(),
});

class SalesController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = salesDataSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: '输入数据无效',
                    details: validation.error.errors,
                });
            }

            const result = await salesService.create(validation.data, (req as any).user.userId);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await salesService.findAll(req.query, (req as any).user);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = salesDataSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: '输入数据无效',
                    details: validation.error.errors,
                });
            }

            const result = await salesService.update(req.params.id, validation.data, (req as any).user.userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await salesService.delete(req.params.id, (req as any).user.userId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await salesService.getStats(req.query, (req as any).user);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default new SalesController();
