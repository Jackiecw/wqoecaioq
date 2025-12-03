import { Request, Response, NextFunction } from 'express';
import todoService from '../services/todoService';
import AppError from '../utils/AppError';

class TodoController {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const todos = await todoService.list((req as any).user.userId);
            res.json(todos);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { content } = req.body || {};
            const todo = await todoService.create(content, (req as any).user.userId);
            res.status(201).json(todo);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params.id) throw new AppError('缺少待办ID', 400);
            const todo = await todoService.update(req.params.id, req.body || {}, (req as any).user.userId);
            res.json(todo);
        } catch (error) {
            next(error);
        }
    }

    async remove(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params.id) throw new AppError('缺少待办ID', 400);
            await todoService.remove(req.params.id, (req as any).user.userId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new TodoController();
