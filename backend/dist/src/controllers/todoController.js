"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const todoService_1 = __importDefault(require("../services/todoService"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class TodoController {
    async list(req, res, next) {
        try {
            const todos = await todoService_1.default.list(req.user.userId);
            res.json(todos);
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const { content } = req.body || {};
            const todo = await todoService_1.default.create(content, req.user.userId);
            res.status(201).json(todo);
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            if (!req.params.id)
                throw new AppError_1.default('缺少待办ID', 400);
            const todo = await todoService_1.default.update(req.params.id, req.body || {}, req.user.userId);
            res.json(todo);
        }
        catch (error) {
            next(error);
        }
    }
    async remove(req, res, next) {
        try {
            if (!req.params.id)
                throw new AppError_1.default('缺少待办ID', 400);
            await todoService_1.default.remove(req.params.id, req.user.userId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new TodoController();
//# sourceMappingURL=todoController.js.map