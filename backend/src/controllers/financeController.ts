import { Request, Response, NextFunction } from 'express';
import financeService from '../services/financeService';
import { z } from 'zod';
import { PaymentMethod, InvoiceStatus } from '@prisma/client';
import AppError from '../utils/AppError';

// Validation Schemas
const expenseSchema = z.object({
    expenseDate: z.string().date("日期格式无效"),
    itemDescription: z.string().min(1, "项目描述不能为空"),
    amount: z.coerce.number().min(0, "金额必须为正数"),
    paymentMethod: z.nativeEnum(PaymentMethod),
    payer: z.string().min(1, "付款方不能为空"),
    payee: z.string().min(1, "收款方不能为空"),
    invoiceStatus: z.nativeEnum(InvoiceStatus),
    isAdvancePayment: z.boolean().default(false),
    reimbursementDate: z.string().date().optional().nullable(),
    storeId: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

const partialExpenseSchema = z.object({
    expenseDate: z.string().date("日期格式无效").optional(),
    itemDescription: z.string().min(1, "项目描述不能为空").optional(),
    amount: z.coerce.number().min(0, "金额必须为正数").optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    payer: z.string().min(1, "付款方不能为空").optional(),
    payee: z.string().min(1, "收款方不能为空").optional(),
    invoiceStatus: z.nativeEnum(InvoiceStatus).optional(),
    isAdvancePayment: z.boolean().optional(),
    reimbursementDate: z.string().date().optional().nullable(),
    storeId: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

export class FinanceController {
    async getOptions(req: Request, res: Response, next: NextFunction) {
        try {
            const options = await financeService.getOptions();
            res.json(options);
        } catch (error) {
            next(error);
        }
    }

    async createExpense(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = (req as any).user;
            const validation = expenseSchema.safeParse(req.body);

            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }

            const newExpense = await financeService.createExpense(userId, validation.data);
            res.status(201).json(newExpense);
        } catch (error) {
            next(error);
        }
    }

    async getExpenses(req: Request, res: Response, next: NextFunction) {
        try {
            const { role, supervisedCountries } = (req as any).user;
            const { storeId, startDate, endDate, sortBy, sortOrder } = req.query;

            const expenses = await financeService.getExpenses({
                storeId: storeId as string,
                startDate: startDate as string,
                endDate: endDate as string,
                sortBy: sortBy as string,
                sortOrder: sortOrder as 'asc' | 'desc'
            }, role, supervisedCountries.map((c: any) => c.code));

            res.json(expenses);
        } catch (error) {
            next(error);
        }
    }

    async updateExpense(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { userId } = (req as any).user;

            const validation = partialExpenseSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }

            const updatedExpense = await financeService.updateExpense(id, userId, validation.data);
            res.json(updatedExpense);
        } catch (error) {
            next(error);
        }
    }

    async deleteExpense(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { userId } = (req as any).user;

            await financeService.deleteExpense(id, userId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async importExpenses(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                throw new AppError('未找到上传的 Excel 文件', 400);
            }
            const { userId } = (req as any).user;

            const result = await financeService.importExpenses(req.file.path, userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async exportExpenses(req: Request, res: Response, next: NextFunction) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                throw new AppError('必须提供 startDate 和 endDate 查询参数', 400);
            }

            const buffer = await financeService.exportExpenses({
                startDate: startDate as string,
                endDate: endDate as string
            });

            const filename = `支出报表_${startDate}_至_${endDate}.xlsx`;
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
}

export default new FinanceController();
