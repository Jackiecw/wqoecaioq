import { Request, Response, NextFunction } from 'express';
import salesImportService from '../services/salesImportService';
import AppError from '../utils/AppError';

class SalesImportController {
    preview = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.file) {
                return next(new AppError('No file uploaded', 400));
            }

            const filePath = req.file.path;
            const platform = req.body.platform;
            const storeId = req.body.storeId;

            const result = await salesImportService.parsePreview(filePath, platform, storeId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    confirm = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { platform, storeId, items } = req.body;
            const enteredById = (req as any).user?.userId;

            if (!items || !Array.isArray(items)) {
                return next(new AppError('Invalid data', 400));
            }
            if (!storeId) {
                return next(new AppError('Store ID is required', 400));
            }
            if (!enteredById) {
                return next(new AppError('Unauthorized: User not found', 401));
            }

            const result = await salesImportService.confirmImport(platform, storeId, items, enteredById);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    getBatches = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = (req as any).user;
            const result = await salesImportService.getBatches(req.query, user);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    rollback = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const result = await salesImportService.rollbackBatch(id, user);
            res.status(200).json(result);
        } catch (error) {
            if (error instanceof Error && error.message === 'Batch not found') {
                return next(new AppError('Batch not found', 404));
            }
            if (error instanceof Error && error.message === 'Permission denied') {
                return next(new AppError('Permission denied', 403));
            }
            next(error);
        }
    };
}

export default new SalesImportController();
