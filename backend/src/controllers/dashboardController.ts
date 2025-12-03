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
            if (!countryCode || !storeId) {
                throw new AppError('countryCode 和 storeId 必填', 400);
            }
            const summary = await dashboardService.getSummary(
                { countryCode, storeId },
                (req as any).user
            );
            res.json(summary);
        } catch (error) {
            next(error);
        }
    }
}

export default new DashboardController();
