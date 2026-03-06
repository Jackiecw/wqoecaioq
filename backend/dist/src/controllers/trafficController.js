"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trafficController = void 0;
const trafficService_1 = require("../services/trafficService");
const zod_1 = require("zod");
const createTrafficSchema = zod_1.z.object({
    recordDate: zod_1.z.string().or(zod_1.z.date()),
    storeId: zod_1.z.string().min(1),
    listingId: zod_1.z.string().optional().nullable(),
    metrics: zod_1.z.record(zod_1.z.any()),
    notes: zod_1.z.string().optional().nullable()
});
const updateTrafficSchema = zod_1.z.object({
    recordDate: zod_1.z.string().or(zod_1.z.date()).optional(),
    storeId: zod_1.z.string().optional(),
    listingId: zod_1.z.string().optional().nullable(),
    metrics: zod_1.z.record(zod_1.z.any()).optional(),
    notes: zod_1.z.string().optional().nullable()
});
exports.trafficController = {
    async getAll(req, res) {
        try {
            const { startDate, endDate, storeId, page = '1', pageSize = '50' } = req.query;
            const parsedPage = parseInt(page, 10);
            const parsedPageSize = parseInt(pageSize, 10);
            const data = await trafficService_1.trafficService.getAll({
                startDate: startDate,
                endDate: endDate,
                storeId: storeId,
                page: isNaN(parsedPage) ? 1 : parsedPage,
                pageSize: isNaN(parsedPageSize) ? 50 : parsedPageSize
            });
            res.json(data);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch traffic data', details: error.message });
        }
    },
    async create(req, res) {
        try {
            const validatedData = createTrafficSchema.parse(req.body);
            const enteredById = req.user?.id;
            if (!enteredById) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const newData = await trafficService_1.trafficService.create({
                ...validatedData,
                enteredById
            });
            res.status(201).json(newData);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: 'Failed to create traffic data', details: error.message });
        }
    },
    async update(req, res) {
        try {
            const { id } = req.params;
            const validatedData = updateTrafficSchema.parse(req.body);
            const updatedData = await trafficService_1.trafficService.update(id, validatedData);
            res.json(updatedData);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: 'Failed to update traffic data', details: error.message });
        }
    },
    async delete(req, res) {
        try {
            const { id } = req.params;
            await trafficService_1.trafficService.delete(id);
            res.json({ message: 'Traffic data deleted successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete traffic data', details: error.message });
        }
    }
};
//# sourceMappingURL=trafficController.js.map