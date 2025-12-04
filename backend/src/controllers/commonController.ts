import { Request, Response, NextFunction } from 'express';
import commonService from '../services/commonService';
import salesService from '../services/salesService';

class CommonController {
    async getCountries(req: Request, res: Response, next: NextFunction) {
        try {
            const countries = await commonService.getCountries();
            res.json(countries);
        } catch (error) {
            next(error);
        }
    }

    async getStores(req: Request, res: Response, next: NextFunction) {
        try {
            // Reuse salesService logic for filtering stores by user permissions
            const stores = await salesService.getStoresList((req as any).user);
            res.json(stores);
        } catch (error) {
            next(error);
        }
    }

    async getExchangeRates(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await commonService.getExchangeRates();
            res.json(data);
        } catch (error) {
            next(error);
        }
    }

    async refreshExchangeRates(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await commonService.refreshExchangeRates();
            res.json(data);
        } catch (error) {
            next(error);
        }
    }

    async getRefreshQuota(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await commonService.getRefreshQuota();
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
}

export default new CommonController();
