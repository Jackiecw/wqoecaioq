import prisma from '../../prismaClient';
import AppError from '../utils/AppError';

const PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY'];

class RecurringTaskService {
    async list(userId: string) {
        return prisma.recurringTask.findMany({
            where: { authorId: userId },
            orderBy: [
                { period: 'asc' },
                { content: 'asc' },
            ],
        });
    }

    async create(data: any, userId: string) {
        const { content, period } = data || {};
        if (!content || !content.trim()) {
            throw new AppError('任务内容不能为空', 400);
        }
        if (!PERIODS.includes(period)) {
            throw new AppError('周期类型无效', 400);
        }
        return prisma.recurringTask.create({
            data: {
                content: content.trim(),
                period,
                authorId: userId,
            },
        });
    }

    async toggle(id: string, isCompleted: boolean, user: any) {
        const task = await prisma.recurringTask.findUnique({ where: { id } });
        if (!task) throw new AppError('周期任务不存在', 404);
        if (task.authorId !== user.userId && user.role !== 'admin') {
            throw new AppError('无权更新该任务', 403);
        }
        return prisma.recurringTask.update({
            where: { id },
            data: {
                lastCompletedAt: isCompleted ? new Date() : null,
            },
        });
    }

    async remove(id: string, user: any) {
        const task = await prisma.recurringTask.findUnique({ where: { id } });
        if (!task) return;
        if (task.authorId !== user.userId && user.role !== 'admin') {
            throw new AppError('无权删除该任务', 403);
        }
        await prisma.recurringTask.delete({ where: { id } });
    }
}

export default new RecurringTaskService();
