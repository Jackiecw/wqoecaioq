"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY'];
class RecurringTaskService {
    async list(userId) {
        return prismaClient_1.default.recurringTask.findMany({
            where: { authorId: userId },
            orderBy: [
                { period: 'asc' },
                { content: 'asc' },
            ],
        });
    }
    async create(data, userId) {
        const { content, period } = data || {};
        if (!content || !content.trim()) {
            throw new AppError_1.default('任务内容不能为空', 400);
        }
        if (!PERIODS.includes(period)) {
            throw new AppError_1.default('周期类型无效', 400);
        }
        return prismaClient_1.default.recurringTask.create({
            data: {
                content: content.trim(),
                period,
                authorId: userId,
            },
        });
    }
    async toggle(id, isCompleted, user) {
        const task = await prismaClient_1.default.recurringTask.findUnique({ where: { id } });
        if (!task)
            throw new AppError_1.default('周期任务不存在', 404);
        if (task.authorId !== user.userId && user.role !== 'admin') {
            throw new AppError_1.default('无权更新该任务', 403);
        }
        return prismaClient_1.default.recurringTask.update({
            where: { id },
            data: {
                lastCompletedAt: isCompleted ? new Date() : null,
            },
        });
    }
    async remove(id, user) {
        const task = await prismaClient_1.default.recurringTask.findUnique({ where: { id } });
        if (!task)
            return;
        if (task.authorId !== user.userId && user.role !== 'admin') {
            throw new AppError_1.default('无权删除该任务', 403);
        }
        await prismaClient_1.default.recurringTask.delete({ where: { id } });
    }
}
exports.default = new RecurringTaskService();
//# sourceMappingURL=recurringTaskService.js.map