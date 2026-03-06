import { Request, Response, NextFunction } from 'express';
import { DynamicDataImporter } from '../services/DynamicDataImporter';
import { advertisingService } from '../services/advertisingService';
import { trafficService } from '../services/trafficService';
import fs from 'fs';

export const dynamicImportController = {
    async previewAdvertising(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const filePath = req.file.path;
            const storeId = req.body.storeId;

            if (!storeId) {
                return res.status(400).json({ error: 'Store ID is required' });
            }

            const result = await DynamicDataImporter.parseAdvertisingPreview(filePath, storeId);

            try {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (e) { }

            res.status(200).json(result);
        } catch (error: any) {
            next(error);
        }
    },

    async previewTraffic(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const filePath = req.file.path;
            const storeId = req.body.storeId;

            if (!storeId) {
                return res.status(400).json({ error: 'Store ID is required' });
            }

            const result = await DynamicDataImporter.parseTrafficPreview(filePath, storeId);

            try {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (e) { }

            res.status(200).json(result);
        } catch (error: any) {
            next(error);
        }
    },

    async confirmAdvertising(req: Request, res: Response, next: NextFunction) {
        try {
            const { items } = req.body;
            const enteredById = (req as any).user?.id;

            if (!items || !Array.isArray(items)) {
                return res.status(400).json({ error: 'Invalid data format' });
            }

            const results = { success: 0, failed: 0, errors: [] as string[] };

            for (const item of items) {
                if (item.hasError) {
                    results.failed++;
                    results.errors.push(item.errorMessage || 'Unknown error');
                    continue;
                }

                try {
                    await advertisingService.create({
                        recordDate: item.recordDate,
                        storeId: item.storeId,
                        currency: item.currency,
                        metrics: item.metrics,
                        notes: item.notes,
                        enteredById
                    });
                    results.success++;
                } catch (e: any) {
                    results.failed++;
                    results.errors.push(`Failed to save record for ${item.recordDate}: ${e.message}`);
                }
            }

            res.status(200).json(results);
        } catch (err: any) {
            next(err);
        }
    },

    async confirmTraffic(req: Request, res: Response, next: NextFunction) {
        try {
            const { items } = req.body;
            const enteredById = (req as any).user?.id;

            if (!items || !Array.isArray(items)) {
                return res.status(400).json({ error: 'Invalid data format' });
            }

            const results = { success: 0, failed: 0, errors: [] as string[] };

            for (const item of items) {
                if (item.hasError) {
                    results.failed++;
                    results.errors.push(item.errorMessage || 'Unknown error');
                    continue;
                }

                try {
                    await trafficService.create({
                        recordDate: item.recordDate,
                        storeId: item.storeId,
                        metrics: item.metrics,
                        notes: item.notes,
                        enteredById
                    });
                    results.success++;
                } catch (e: any) {
                    results.failed++;
                    results.errors.push(`Failed to save record for ${item.recordDate}: ${e.message}`);
                }
            }

            res.status(200).json(results);
        } catch (err: any) {
            next(err);
        }
    }
};
