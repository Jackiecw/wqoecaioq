"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advertisingController = void 0;
const advertisingService_1 = require("../services/advertisingService");
const zod_1 = require("zod");
const createAdvertisingSchema = zod_1.z.object({
    recordDate: zod_1.z.string().or(zod_1.z.date()),
    storeId: zod_1.z.string().min(1),
    listingId: zod_1.z.string().optional().nullable(),
    currency: zod_1.z.string().optional(),
    metrics: zod_1.z.record(zod_1.z.any()),
    notes: zod_1.z.string().optional().nullable()
});
const updateAdvertisingSchema = zod_1.z.object({
    recordDate: zod_1.z.string().or(zod_1.z.date()).optional(),
    storeId: zod_1.z.string().optional(),
    listingId: zod_1.z.string().optional().nullable(),
    currency: zod_1.z.string().optional(),
    metrics: zod_1.z.record(zod_1.z.any()).optional(),
    notes: zod_1.z.string().optional().nullable()
});
exports.advertisingController = {
    async getAll(req, res) {
        try {
            const { startDate, endDate, storeId, page = '1', pageSize = '50' } = req.query;
            const parsedPage = parseInt(page, 10);
            const parsedPageSize = parseInt(pageSize, 10);
            const data = await advertisingService_1.advertisingService.getAll({
                startDate: startDate,
                endDate: endDate,
                storeId: storeId,
                page: isNaN(parsedPage) ? 1 : parsedPage,
                pageSize: isNaN(parsedPageSize) ? 50 : parsedPageSize
            });
            res.json(data);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch advertising data', details: error.message });
        }
    },
    async create(req, res) {
        try {
            const validatedData = createAdvertisingSchema.parse(req.body);
            const enteredById = req.user?.id;
            if (!enteredById) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const newData = await advertisingService_1.advertisingService.create({
                ...validatedData,
                enteredById
            });
            res.status(201).json(newData);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: 'Failed to create advertising data', details: error.message });
        }
    },
    async update(req, res) {
        try {
            const { id } = req.params;
            const validatedData = updateAdvertisingSchema.parse(req.body);
            const updatedData = await advertisingService_1.advertisingService.update(id, validatedData);
            res.json(updatedData);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: 'Failed to update advertising data', details: error.message });
        }
    },
    async delete(req, res) {
        try {
            const { id } = req.params;
            await advertisingService_1.advertisingService.delete(id);
            res.json({ message: 'Advertising data deleted successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete advertising data', details: error.message });
        }
    }
};
//# sourceMappingURL=advertisingController.js.map