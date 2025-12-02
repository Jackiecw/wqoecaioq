import { Request, Response, NextFunction } from 'express';
import performanceService from '../services/performanceService';
import { z } from 'zod';
import AppError from '../utils/AppError';

// --- Zod Schemas ---
const templateItemSchema = z.object({
    category: z.string().min(1),
    kpiName: z.string().min(1),
    description: z.string().optional(),
    weight: z.number().min(0).max(100),
});

const createTemplateSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    items: z.array(templateItemSchema).min(1),
});

const assignReviewSchema = z.object({
    employeeId: z.string(),
    templateId: z.string(),
    month: z.string(), // "YYYY-MM" format
    managerId: z.string(),
    directorId: z.string().optional(),
});

const updateReviewSchema = z.object({
    status: z.enum(['DRAFT', 'SELF_REVIEW', 'MANAGER_REVIEW', 'DIRECTOR_REVIEW', 'COMPLETED', 'CANCELED']).optional(),
    summaryThisMonth: z.string().nullable().optional(),
    planNextMonth: z.string().nullable().optional(),
    companySuggestions: z.string().nullable().optional(),
    items: z.array(z.object({
        id: z.string(),
        selfScore: z.number().nullable().optional(),
        selfComment: z.string().nullable().optional(),
        managerScore: z.number().nullable().optional(),
        managerComment: z.string().nullable().optional(),
        directorScore: z.number().nullable().optional(),
        directorComment: z.string().nullable().optional(),
    })).optional(),
});

export class PerformanceController {
    async getAllTemplates(req: Request, res: Response, next: NextFunction) {
        try {
            const templates = await performanceService.getAllTemplates();
            res.json(templates);
        } catch (error) {
            next(error);
        }
    }

    async createTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = createTemplateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const template = await performanceService.createTemplate(validation.data);
            res.status(201).json(template);
        } catch (error) {
            next(error);
        }
    }

    async assignReview(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = assignReviewSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const review = await performanceService.assignReview(validation.data);
            res.status(201).json(review);
        } catch (error) {
            next(error);
        }
    }

    async getMyReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = (req as any).user;
            const reviews = await performanceService.getMyReviews(userId);
            res.json(reviews);
        } catch (error) {
            next(error);
        }
    }

    async getPendingReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = (req as any).user;
            const reviews = await performanceService.getPendingReviews(userId);
            res.json(reviews);
        } catch (error) {
            next(error);
        }
    }

    async getReviewDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, role } = (req as any).user;
            const review = await performanceService.getReviewDetail(req.params.id, userId, role);
            res.json(review);
        } catch (error) {
            next(error);
        }
    }

    async updateReview(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = updateReviewSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedReview = await performanceService.updateReview(req.params.id, validation.data);
            res.json(updatedReview);
        } catch (error) {
            next(error);
        }
    }
}

export default new PerformanceController();
