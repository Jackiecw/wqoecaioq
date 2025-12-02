"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceController = void 0;
const financeService_1 = __importDefault(require("../services/financeService"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../utils/AppError"));
// Validation Schemas
const expenseSchema = zod_1.z.object({
    expenseDate: zod_1.z.string().date("日期格式无效"),
    itemDescription: zod_1.z.string().min(1, "项目描述不能为空"),
    amount: zod_1.z.coerce.number().min(0, "金额必须为正数"),
    paymentMethod: zod_1.z.nativeEnum(client_1.PaymentMethod),
    payer: zod_1.z.string().min(1, "付款方不能为空"),
    payee: zod_1.z.string().min(1, "收款方不能为空"),
    invoiceStatus: zod_1.z.nativeEnum(client_1.InvoiceStatus),
    isAdvancePayment: zod_1.z.boolean().default(false),
    reimbursementDate: zod_1.z.string().date().optional().nullable(),
    storeId: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
});
const partialExpenseSchema = zod_1.z.object({
    expenseDate: zod_1.z.string().date("日期格式无效").optional(),
    itemDescription: zod_1.z.string().min(1, "项目描述不能为空").optional(),
    amount: zod_1.z.coerce.number().min(0, "金额必须为正数").optional(),
    paymentMethod: zod_1.z.nativeEnum(client_1.PaymentMethod).optional(),
    payer: zod_1.z.string().min(1, "付款方不能为空").optional(),
    payee: zod_1.z.string().min(1, "收款方不能为空").optional(),
    invoiceStatus: zod_1.z.nativeEnum(client_1.InvoiceStatus).optional(),
    isAdvancePayment: zod_1.z.boolean().optional(),
    reimbursementDate: zod_1.z.string().date().optional().nullable(),
    storeId: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
});
class FinanceController {
    async getOptions(req, res, next) {
        try {
            const options = await financeService_1.default.getOptions();
            res.json(options);
        }
        catch (error) {
            next(error);
        }
    }
    async createExpense(req, res, next) {
        try {
            const { userId } = req.user;
            const validation = expenseSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newExpense = await financeService_1.default.createExpense(userId, validation.data);
            res.status(201).json(newExpense);
        }
        catch (error) {
            next(error);
        }
    }
    async getExpenses(req, res, next) {
        try {
            const { role, supervisedCountries } = req.user;
            const { storeId, startDate, endDate, sortBy, sortOrder } = req.query;
            const expenses = await financeService_1.default.getExpenses({
                storeId: storeId,
                startDate: startDate,
                endDate: endDate,
                sortBy: sortBy,
                sortOrder: sortOrder
            }, role, supervisedCountries.map((c) => c.code));
            res.json(expenses);
        }
        catch (error) {
            next(error);
        }
    }
    async updateExpense(req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = req.user;
            const validation = partialExpenseSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedExpense = await financeService_1.default.updateExpense(id, userId, validation.data);
            res.json(updatedExpense);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteExpense(req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = req.user;
            await financeService_1.default.deleteExpense(id, userId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    async importExpenses(req, res, next) {
        try {
            if (!req.file) {
                throw new AppError_1.default('未找到上传的 Excel 文件', 400);
            }
            const { userId } = req.user;
            const result = await financeService_1.default.importExpenses(req.file.path, userId);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async exportExpenses(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                throw new AppError_1.default('必须提供 startDate 和 endDate 查询参数', 400);
            }
            const buffer = await financeService_1.default.exportExpenses({
                startDate: startDate,
                endDate: endDate
            });
            const filename = `支出报表_${startDate}_至_${endDate}.xlsx`;
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.FinanceController = FinanceController;
exports.default = new FinanceController();
//# sourceMappingURL=financeController.js.map