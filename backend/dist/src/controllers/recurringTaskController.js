"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const recurringTaskService_1 = __importDefault(require("../services/recurringTaskService"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class RecurringTaskController {
    async list(req, res, next) {
        try {
            const tasks = await recurringTaskService_1.default.list(req.user.userId);
            res.json(tasks);
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const task = await recurringTaskService_1.default.create(req.body || {}, req.user.userId);
            res.status(201).json(task);
        }
        catch (error) {
            next(error);
        }
    }
    async toggle(req, res, next) {
        try {
            if (!req.params.id)
                throw new AppError_1.default('缺少任务ID', 400);
            const { isCompleted = false } = req.body || {};
            const task = await recurringTaskService_1.default.toggle(req.params.id, !!isCompleted, req.user);
            res.json(task);
        }
        catch (error) {
            next(error);
        }
    }
    async remove(req, res, next) {
        try {
            if (!req.params.id)
                throw new AppError_1.default('缺少任务ID', 400);
            await recurringTaskService_1.default.remove(req.params.id, req.user);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new RecurringTaskController();
//# sourceMappingURL=recurringTaskController.js.map