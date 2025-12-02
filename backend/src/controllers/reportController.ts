import { Request, Response, NextFunction } from 'express';
import reportService from '../services/reportService';
import { z } from 'zod';

const createReportSchema = z.object({
    weekStartDate: z.string().date(),
    summaryThisWeek: z.string().min(1),
    planNextWeek: z.string().min(1),
    problemsEncountered: z.string().optional(),
    other: z.string().optional(),
});

export class ReportController {
    async getReports(req: Request, res: Response, next: NextFunction) {
        try {
            const reports = await reportService.getReports((req as any).user);
            res.json(reports);
        } catch (error) {
            next(error);
        }
    }

    async createReport(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = createReportSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Invalid input',
                    details: validation.error.errors
                });
            }
            const report = await reportService.createReport(validation.data, (req as any).user.userId);
            res.status(201).json(report);
        } catch (error) {
            next(error);
        }
    }

    async deleteReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, role } = (req as any).user;
            await reportService.deleteReport(req.params.id, userId, role);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new ReportController();
