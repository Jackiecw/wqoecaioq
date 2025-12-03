import { Request, Response, NextFunction } from 'express';
import operationService from '../services/operationService';
import { z } from 'zod';
import AppError from '../utils/AppError';

// --- Zod Schemas ---
const moduleSchema = z.object({
    name: z.string().min(1, "板块名称不能为空"),
    ownerId: z.string().optional().nullable(),
    countryCode: z.string().min(1, "必须关联一个国家"),
});

const taskSchema = z.object({
    name: z.string().min(1, "事项名称不能为空"),
    ownerId: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    moduleId: z.string().min(1, "必须关联一个板块"),
});

const partialTaskSchema = z.object({
    name: z.string().min(1, "事项名称不能为空").optional(),
    ownerId: z.string().nullable().optional(),
    notes: z.string().optional().nullable(),
});

const partialModuleSchema = z.object({
    name: z.string().min(1).optional(),
    ownerId: z.string().nullable().optional(),
});

export class OperationController {
    async getModules(req: Request, res: Response, next: NextFunction) {
        try {
            const { country } = req.query;
            if (!country) {
                throw new AppError('必须提供 country 查询参数', 400);
            }
            const modules = await operationService.getModules(country as string);
            res.json(modules);
        } catch (error) {
            next(error);
        }
    }

    async getCountries(req: Request, res: Response, next: NextFunction) {
        try {
            const countries = await operationService.getCountries();
            res.json(countries);
        } catch (error) {
            next(error);
        }
    }

    async getLinks(req: Request, res: Response, next: NextFunction) {
        try {
            const links = await operationService.getLinks();
            res.json(links);
        } catch (error) {
            next(error);
        }
    }

    async getRates(req: Request, res: Response, next: NextFunction) {
        try {
            const { getRates } = require('../utils/dataHelpers');
            const data = await getRates();
            res.json(data);
        } catch (error) {
            next(error);
        }
    }

    async refreshRates(req: Request, res: Response, next: NextFunction) {
        try {
            const { getRates } = require('../utils/dataHelpers');
            const data = await getRates({ forceRefresh: true });
            res.json({
                rates: data.rates,
                updatedAt: data.lastFetched ? new Date(data.lastFetched).toISOString() : new Date().toISOString(),
                remainingRefreshes: null,
            });
        } catch (error) {
            next(error);
        }
    }

    async createModule(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = moduleSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newModule = await operationService.createModule(validation.data);
            res.status(201).json(newModule);
        } catch (error) {
            next(error);
        }
    }

    async createTask(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = taskSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newTask = await operationService.createTask(validation.data);
            res.status(201).json(newTask);
        } catch (error) {
            next(error);
        }
    }

    async updateTask(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = partialTaskSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedTask = await operationService.updateTask(req.params.id, validation.data);
            res.json(updatedTask);
        } catch (error) {
            next(error);
        }
    }

    async updateModule(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = partialModuleSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedModule = await operationService.updateModule(req.params.id, validation.data);
            res.json(updatedModule);
        } catch (error) {
            next(error);
        }
    }

    async deleteTask(req: Request, res: Response, next: NextFunction) {
        try {
            await operationService.deleteTask(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async deleteModule(req: Request, res: Response, next: NextFunction) {
        try {
            await operationService.deleteModule(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new OperationController();
