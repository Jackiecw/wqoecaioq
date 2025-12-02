import prisma from '../../prismaClient';
import { Expense, PaymentMethod, InvoiceStatus, Prisma } from '@prisma/client';
import AppError from '../utils/AppError';
import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

interface ExpenseFilters {
    storeId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    supervisedCountries?: string[];
}

export class FinanceService {

    async checkExpensePermission(userId: string, expenseId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: { select: { name: true } }, supervisedCountries: { select: { code: true } } }
        });

        if (!user) {
            throw new AppError('用户未找到', 404);
        }

        if (user.role.name === 'admin') {
            return true;
        }

        const expense = await prisma.expense.findUnique({
            where: { id: expenseId },
            include: { store: { select: { countryCode: true } } }
        });

        if (!expense) {
            throw new AppError('支出数据未找到', 404);
        }

        // Company level expense (no store) -> Admin only
        if (!expense.store) {
            throw new AppError('权限不足：此为公司级支出', 403);
        }

        const supervisedCodes = user.supervisedCountries.map(c => c.code);
        if (supervisedCodes.includes(expense.store.countryCode)) {
            return true;
        }

        throw new AppError('权限不足：您不是该国家的主管', 403);
    }

    async getOptions() {
        return {
            paymentMethods: Object.values(PaymentMethod),
            invoiceStatuses: Object.values(InvoiceStatus),
        };
    }

    async createExpense(userId: string, data: any) {
        try {
            return await prisma.expense.create({
                data: {
                    ...data,
                    expenseDate: new Date(data.expenseDate),
                    reimbursementDate: data.reimbursementDate ? new Date(data.reimbursementDate) : null,
                    notes: data.notes || null,
                    storeId: data.storeId || null,
                    enteredById: userId,
                }
            });
        } catch (error: any) {
            if (error.code === 'P2003' && error.meta?.target?.includes('storeId')) {
                throw new AppError('所选的归属店铺无效', 400);
            }
            throw error;
        }
    }

    async getExpenses(filters: ExpenseFilters, userRole: string, supervisedCountries: string[]) {
        const { storeId, startDate, endDate, sortBy, sortOrder } = filters;
        const where: Prisma.ExpenseWhereInput = {};

        // Permission filter
        if (userRole !== 'admin') {
            where.store = {
                countryCode: { in: supervisedCountries }
            };
        }

        // Query filters
        if (storeId) {
            where.storeId = storeId;
        }
        if (startDate && endDate) {
            where.expenseDate = {
                gte: new Date(startDate),
                lte: new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1))
            };
        } else if (startDate) {
            where.expenseDate = { gte: new Date(startDate) };
        }

        // Sorting
        const orderBy: Prisma.ExpenseOrderByWithRelationInput = {};
        if (sortBy && (sortOrder === 'asc' || sortOrder === 'desc')) {
            if (['expenseDate', 'amount', 'createdAt'].includes(sortBy)) {
                (orderBy as any)[sortBy] = sortOrder;
            }
        } else {
            orderBy.expenseDate = 'desc';
        }

        const expenses = await prisma.expense.findMany({
            where,
            orderBy,
            include: {
                store: {
                    select: { name: true, countryCode: true }
                },
                enteredBy: {
                    select: { nickname: true }
                }
            }
        });

        // Add permission flag
        const isAdmin = userRole === 'admin';
        return expenses.map(ex => ({
            ...ex,
            canManage: isAdmin || (ex.store && supervisedCountries.includes(ex.store.countryCode))
        }));
    }

    async updateExpense(id: string, userId: string, data: any) {
        await this.checkExpensePermission(userId, id);

        const payload: any = { ...data };
        if (data.expenseDate) payload.expenseDate = new Date(data.expenseDate);
        if (data.reimbursementDate) payload.reimbursementDate = new Date(data.reimbursementDate);
        else if (data.reimbursementDate === null) payload.reimbursementDate = null;

        if (data.storeId === null) payload.storeId = null;
        if (data.notes === null) payload.notes = null;

        const updatedExpense = await prisma.expense.update({
            where: { id },
            data: payload,
            include: {
                store: { select: { name: true, countryCode: true } },
                enteredBy: { select: { nickname: true } }
            }
        });

        return {
            ...updatedExpense,
            canManage: true
        };
    }

    async deleteExpense(id: string, userId: string) {
        await this.checkExpensePermission(userId, id);
        await prisma.expense.delete({ where: { id } });
    }

    async importExpenses(filePath: string, userId: string) {
        let storeMap = new Map<string, string>();
        try {
            const stores = await prisma.store.findMany({ select: { id: true, name: true } });
            stores.forEach(store => storeMap.set(store.name, store.id));
        } catch (e) {
            throw new AppError('无法加载店铺列表用于匹配', 500);
        }

        let importedCount = 0;
        let failedRows: any[] = [];

        try {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows: any[] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

            if (rows.length <= 1) {
                throw new AppError('文件为空或只有表头', 400);
            }

            const parseExcelDate = (excelDate: any) => {
                if (typeof excelDate === 'number') {
                    const date = new Date((excelDate - 25569) * 86400 * 1000);
                    return date.toISOString().split('T')[0];
                }
                return excelDate;
            };

            const paymentMethodMap: any = { '支付宝': 'ALIPAY', '微信支付': 'WECHAT_PAY', '银行转账': 'BANK_TRANSFER', '信用卡': 'CREDIT_CARD', '现金': 'CASH', '其他': 'OTHER' };
            const invoiceStatusMap: any = { '无票': 'NONE', '普票': 'REGULAR', '专票': 'SPECIAL' };

            const headers = rows[0] as string[];
            const headerMap: any = {
                '支出日期': 'expenseDate',
                '项目描述': 'itemDescription',
                '金额': 'amount',
                '付款方式': 'paymentMethod',
                '付款方': 'payer',
                '收款方': 'payee',
                '票据状态': 'invoiceStatus',
                '是否垫付(Y/N)': 'isAdvancePayment',
                '归属店铺名称': 'storeName',
                '备注': 'notes',
                '报销日期': 'reimbursementDate',
            };

            const dataRows = rows.slice(1);
            const recordsToCreate: any[] = [];

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i] as any[];
                if (row.length === 0) continue;

                let record: any = {};

                headers.forEach((header, index) => {
                    const prismaKey = headerMap[header];
                    if (prismaKey) {
                        record[prismaKey] = row[index];
                    }
                });

                try {
                    record.expenseDate = parseExcelDate(record.expenseDate);
                    if (record.reimbursementDate) {
                        record.reimbursementDate = parseExcelDate(record.reimbursementDate);
                    }

                    record.paymentMethod = paymentMethodMap[record.paymentMethod] || 'OTHER';
                    record.invoiceStatus = invoiceStatusMap[record.invoiceStatus] || 'NONE';

                    const adv = record.isAdvancePayment ? String(record.isAdvancePayment).toUpperCase() : 'N';
                    record.isAdvancePayment = (adv === 'Y' || adv === 'YES' || adv === '是');

                    if (record.storeName && storeMap.has(record.storeName)) {
                        record.storeId = storeMap.get(record.storeName);
                    } else {
                        record.storeId = null;
                    }

                    // Basic validation (we can use Zod here too if we import schema, but manual check is fine for now or reuse schema from controller if exported)
                    // Let's do basic checks to avoid circular deps or complex setup
                    if (!record.expenseDate) throw new Error("日期无效");
                    if (!record.itemDescription) throw new Error("缺少项目描述");
                    if (isNaN(Number(record.amount)) || Number(record.amount) < 0) throw new Error("金额无效");

                    record.amount = Number(record.amount);
                    record.enteredById = userId;
                    record.expenseDate = new Date(record.expenseDate);
                    record.reimbursementDate = record.reimbursementDate ? new Date(record.reimbursementDate) : null;

                    // Remove storeName as it's not in DB
                    delete record.storeName;

                    recordsToCreate.push(record);

                } catch (err: any) {
                    failedRows.push({ row: i + 2, error: err.message });
                }
            }

            if (recordsToCreate.length > 0) {
                const result = await prisma.expense.createMany({
                    data: recordsToCreate,
                });
                importedCount = result.count;
            }

            return {
                message: '导入完成',
                importedCount,
                failedCount: failedRows.length,
                failedRows
            };

        } finally {
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) console.error("删除临时文件失败:", err);
                });
            }
        }
    }

    async exportExpenses(filters: { startDate: string, endDate: string }) {
        const { startDate, endDate } = filters;

        const where = {
            expenseDate: {
                gte: new Date(startDate),
                lte: new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1)),
            }
        };

        const expenses = await prisma.expense.findMany({
            where,
            orderBy: { expenseDate: 'asc' },
            include: {
                store: { select: { name: true } },
                enteredBy: { select: { nickname: true } }
            }
        });

        const paymentMethodMap: any = { 'ALIPAY': '支付宝', 'WECHAT_PAY': '微信支付', 'BANK_TRANSFER': '银行转账', 'CREDIT_CARD': '信用卡', 'CASH': '现金', 'OTHER': '其他' };
        const invoiceStatusMap: any = { 'NONE': '无票', 'REGULAR': '普票', 'SPECIAL': '专票' };
        const formatDate = (date: Date | null) => date ? new Date(date).toISOString().split('T')[0] : '';

        const dataForExcel = expenses.map(ex => ({
            '支出日期': formatDate(ex.expenseDate),
            '项目描述': ex.itemDescription,
            '金额': ex.amount,
            '付款方式': paymentMethodMap[ex.paymentMethod] || ex.paymentMethod,
            '付款方': ex.payer,
            '收款方': ex.payee,
            '票据状态': invoiceStatusMap[ex.invoiceStatus] || ex.invoiceStatus,
            '是否垫付(Y/N)': ex.isAdvancePayment ? 'Y' : 'N',
            '报销日期': formatDate(ex.reimbursementDate),
            '归属店铺名称': ex.store ? ex.store.name : '',
            '备注': ex.notes || '',
            '录入人': ex.enteredBy.nickname,
        }));

        const headers = [
            '支出日期', '项目描述', '金额',
            '付款方式', '付款方', '收款方',
            '票据状态', '是否垫付(Y/N)', '报销日期',
            '归属店铺名称', '备注', '录入人'
        ];

        const ws = xlsx.utils.json_to_sheet(dataForExcel, { header: headers });

        ws['!cols'] = [
            { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 12 },
            { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
            { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 15 }
        ];

        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, '支出报表');

        return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }
}

export default new FinanceService();
