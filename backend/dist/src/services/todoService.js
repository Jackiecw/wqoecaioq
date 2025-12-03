"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class TodoService {
    async list(userId) {
        return prismaClient_1.default.todo.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(content, userId) {
        if (!content || !content.trim()) {
            throw new AppError_1.default('待办内容不能为空', 400);
        }
        return prismaClient_1.default.todo.create({
            data: {
                content: content.trim(),
                authorId: userId,
            },
        });
    }
    async update(id, data, userId) {
        const todo = await prismaClient_1.default.todo.findUnique({ where: { id } });
        if (!todo)
            throw new AppError_1.default('待办不存在', 404);
        if (todo.authorId !== userId)
            throw new AppError_1.default('无权修改该待办', 403);
        const payload = {};
        if (data.content !== undefined)
            payload.content = String(data.content);
        if (data.isCompleted !== undefined)
            payload.isCompleted = !!data.isCompleted;
        return prismaClient_1.default.todo.update({
            where: { id },
            data: payload,
        });
    }
    async remove(id, userId) {
        const todo = await prismaClient_1.default.todo.findUnique({ where: { id } });
        if (!todo)
            return;
        if (todo.authorId !== userId)
            throw new AppError_1.default('无权删除该待办', 403);
        await prismaClient_1.default.todo.delete({ where: { id } });
    }
}
exports.default = new TodoService();
//# sourceMappingURL=todoService.js.map