import { Request, Response, NextFunction } from 'express';
import recurringTaskService from '../services/recurringTaskService';
import AppError from '../utils/AppError';

class RecurringTaskController {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const tasks = await recurringTaskService.list((req as any).user.userId);
            res.json(tasks);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const task = await recurringTaskService.create(req.body || {}, (req as any).user.userId);
            res.status(201).json(task);
        } catch (error) {
            next(error);
        }
    }

    async toggle(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params.id) throw new AppError('缺少任务ID', 400);
            const { isCompleted = false } = req.body || {};
            const task = await recurringTaskService.toggle(req.params.id, !!isCompleted, (req as any).user);
            res.json(task);
        } catch (error) {
            next(error);
        }
    }

    async remove(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params.id) throw new AppError('缺少任务ID', 400);
            await recurringTaskService.remove(req.params.id, (req as any).user);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new RecurringTaskController();
