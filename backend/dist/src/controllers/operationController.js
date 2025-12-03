"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationController = void 0;
const operationService_1 = __importDefault(require("../services/operationService"));
const zod_1 = require("zod");
const AppError_1 = __importDefault(require("../utils/AppError"));
// --- Zod Schemas ---
const moduleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "板块名称不能为空"),
    ownerId: zod_1.z.string().optional().nullable(),
    countryCode: zod_1.z.string().min(1, "必须关联一个国家"),
});
const taskSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "事项名称不能为空"),
    ownerId: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
    moduleId: zod_1.z.string().min(1, "必须关联一个板块"),
});
const partialTaskSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "事项名称不能为空").optional(),
    ownerId: zod_1.z.string().nullable().optional(),
    notes: zod_1.z.string().optional().nullable(),
});
const partialModuleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    ownerId: zod_1.z.string().nullable().optional(),
});
class OperationController {
    async getModules(req, res, next) {
        try {
            const { country } = req.query;
            if (!country) {
                throw new AppError_1.default('必须提供 country 查询参数', 400);
            }
            const modules = await operationService_1.default.getModules(country);
            res.json(modules);
        }
        catch (error) {
            next(error);
        }
    }
    async getCountries(req, res, next) {
        try {
            const countries = await operationService_1.default.getCountries();
            res.json(countries);
        }
        catch (error) {
            next(error);
        }
    }
    async getLinks(req, res, next) {
        try {
            const links = await operationService_1.default.getLinks();
            res.json(links);
        }
        catch (error) {
            next(error);
        }
    }
    async getRates(req, res, next) {
        try {
            const { getRates } = require('../utils/dataHelpers');
            const data = await getRates();
            res.json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async refreshRates(req, res, next) {
        try {
            const { getRates } = require('../utils/dataHelpers');
            const data = await getRates({ forceRefresh: true });
            res.json({
                rates: data.rates,
                updatedAt: data.lastFetched ? new Date(data.lastFetched).toISOString() : new Date().toISOString(),
                remainingRefreshes: null,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createModule(req, res, next) {
        try {
            const validation = moduleSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newModule = await operationService_1.default.createModule(validation.data);
            res.status(201).json(newModule);
        }
        catch (error) {
            next(error);
        }
    }
    async createTask(req, res, next) {
        try {
            const validation = taskSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newTask = await operationService_1.default.createTask(validation.data);
            res.status(201).json(newTask);
        }
        catch (error) {
            next(error);
        }
    }
    async updateTask(req, res, next) {
        try {
            const validation = partialTaskSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedTask = await operationService_1.default.updateTask(req.params.id, validation.data);
            res.json(updatedTask);
        }
        catch (error) {
            next(error);
        }
    }
    async updateModule(req, res, next) {
        try {
            const validation = partialModuleSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedModule = await operationService_1.default.updateModule(req.params.id, validation.data);
            res.json(updatedModule);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteTask(req, res, next) {
        try {
            await operationService_1.default.deleteTask(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    async deleteModule(req, res, next) {
        try {
            await operationService_1.default.deleteModule(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.OperationController = OperationController;
exports.default = new OperationController();
//# sourceMappingURL=operationController.js.map