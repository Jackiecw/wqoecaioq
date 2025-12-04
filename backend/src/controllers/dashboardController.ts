import { Request, Response, NextFunction } from 'express';
import dashboardService from '../services/dashboardService';
import AppError from '../utils/AppError';

class DashboardController {
    async getFilterOptions(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await dashboardService.getFilterOptions((req as any).user);
            res.json(data);
        } catch (error) {
            next(error);
        }
    }

    async getSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const { countryCode, storeId } = req.query;
            // Allow optional params. Service should handle undefined.
            const summary = await dashboardService.getSummary(
                {
                    countryCode: countryCode as string | undefined,
                    storeId: storeId as string | undefined
                },
                (req as any).user
            );
            res.json(summary);
        } catch (error) {
            next(error);
        }
    }
}

export default new DashboardController();
