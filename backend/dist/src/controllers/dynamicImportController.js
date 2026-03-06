"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicImportController = void 0;
const DynamicDataImporter_1 = require("../services/DynamicDataImporter");
const advertisingService_1 = require("../services/advertisingService");
const trafficService_1 = require("../services/trafficService");
const fs_1 = __importDefault(require("fs"));
exports.dynamicImportController = {
    async previewAdvertising(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const filePath = req.file.path;
            const storeId = req.body.storeId;
            if (!storeId) {
                return res.status(400).json({ error: 'Store ID is required' });
            }
            const result = await DynamicDataImporter_1.DynamicDataImporter.parseAdvertisingPreview(filePath, storeId);
            try {
                if (fs_1.default.existsSync(filePath))
                    fs_1.default.unlinkSync(filePath);
            }
            catch (e) { }
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async previewTraffic(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const filePath = req.file.path;
            const storeId = req.body.storeId;
            if (!storeId) {
                return res.status(400).json({ error: 'Store ID is required' });
            }
            const result = await DynamicDataImporter_1.DynamicDataImporter.parseTrafficPreview(filePath, storeId);
            try {
                if (fs_1.default.existsSync(filePath))
                    fs_1.default.unlinkSync(filePath);
            }
            catch (e) { }
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async confirmAdvertising(req, res, next) {
        try {
            const { items } = req.body;
            const enteredById = req.user?.id;
            if (!items || !Array.isArray(items)) {
                return res.status(400).json({ error: 'Invalid data format' });
            }
            const results = { success: 0, failed: 0, errors: [] };
            for (const item of items) {
                if (item.hasError) {
                    results.failed++;
                    results.errors.push(item.errorMessage || 'Unknown error');
                    continue;
                }
                try {
                    await advertisingService_1.advertisingService.create({
                        recordDate: item.recordDate,
                        storeId: item.storeId,
                        currency: item.currency,
                        metrics: item.metrics,
                        notes: item.notes,
                        enteredById
                    });
                    results.success++;
                }
                catch (e) {
                    results.failed++;
                    results.errors.push(`Failed to save record for ${item.recordDate}: ${e.message}`);
                }
            }
            res.status(200).json(results);
        }
        catch (err) {
            next(err);
        }
    },
    async confirmTraffic(req, res, next) {
        try {
            const { items } = req.body;
            const enteredById = req.user?.id;
            if (!items || !Array.isArray(items)) {
                return res.status(400).json({ error: 'Invalid data format' });
            }
            const results = { success: 0, failed: 0, errors: [] };
            for (const item of items) {
                if (item.hasError) {
                    results.failed++;
                    results.errors.push(item.errorMessage || 'Unknown error');
                    continue;
                }
                try {
                    await trafficService_1.trafficService.create({
                        recordDate: item.recordDate,
                        storeId: item.storeId,
                        metrics: item.metrics,
                        notes: item.notes,
                        enteredById
                    });
                    results.success++;
                }
                catch (e) {
                    results.failed++;
                    results.errors.push(`Failed to save record for ${item.recordDate}: ${e.message}`);
                }
            }
            res.status(200).json(results);
        }
        catch (err) {
            next(err);
        }
    }
};
//# sourceMappingURL=dynamicImportController.js.map