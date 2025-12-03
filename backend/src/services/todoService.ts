import prisma from '../../prismaClient';
import AppError from '../utils/AppError';

class TodoService {
    async list(userId: string) {
        return prisma.todo.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(content: string, userId: string) {
        if (!content || !content.trim()) {
            throw new AppError('待办内容不能为空', 400);
        }
        return prisma.todo.create({
            data: {
                content: content.trim(),
                authorId: userId,
            },
        });
    }

    async update(id: string, data: any, userId: string) {
        const todo = await prisma.todo.findUnique({ where: { id } });
        if (!todo) throw new AppError('待办不存在', 404);
        if (todo.authorId !== userId) throw new AppError('无权修改该待办', 403);

        const payload: any = {};
        if (data.content !== undefined) payload.content = String(data.content);
        if (data.isCompleted !== undefined) payload.isCompleted = !!data.isCompleted;

        return prisma.todo.update({
            where: { id },
            data: payload,
        });
    }

    async remove(id: string, userId: string) {
        const todo = await prisma.todo.findUnique({ where: { id } });
        if (!todo) return;
        if (todo.authorId !== userId) throw new AppError('无权删除该待办', 403);
        await prisma.todo.delete({ where: { id } });
    }
}

export default new TodoService();
