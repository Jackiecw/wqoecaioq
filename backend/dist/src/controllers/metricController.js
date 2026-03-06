"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricController = void 0;
const metricService_1 = require("../services/metricService");
const zod_1 = require("zod");
const createMetricSchema = zod_1.z.object({
    type: zod_1.z.enum(['ADVERTISING', 'TRAFFIC']),
    name: zod_1.z.string().min(1),
    label: zod_1.z.string().min(1),
    isActive: zod_1.z.boolean().optional(),
    order: zod_1.z.number().int().optional()
});
const updateMetricSchema = zod_1.z.object({
    label: zod_1.z.string().min(1).optional(),
    isActive: zod_1.z.boolean().optional(),
    order: zod_1.z.number().int().optional()
});
exports.metricController = {
    async getAllMetrics(req, res) {
        try {
            const { type } = req.query;
            const metrics = await metricService_1.metricService.getAllMetrics(type);
            res.json(metrics);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch metrics', details: error.message });
        }
    },
    async getActiveMetrics(req, res) {
        try {
            const { type } = req.query;
            if (!type || (type !== 'ADVERTISING' && type !== 'TRAFFIC')) {
                return res.status(400).json({ error: 'Invalid or missing type parameter' });
            }
            const metrics = await metricService_1.metricService.getActiveMetrics(type);
            res.json(metrics);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch active metrics', details: error.message });
        }
    },
    async createMetric(req, res) {
        try {
            const validatedData = createMetricSchema.parse(req.body);
            const newMetric = await metricService_1.metricService.createMetric(validatedData);
            res.status(201).json(newMetric);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: 'Failed to create metric', details: error.message });
        }
    },
    async updateMetric(req, res) {
        try {
            const { id } = req.params;
            const validatedData = updateMetricSchema.parse(req.body);
            const updatedMetric = await metricService_1.metricService.updateMetric(id, validatedData);
            res.json(updatedMetric);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: 'Failed to update metric', details: error.message });
        }
    },
    async deleteMetric(req, res) {
        try {
            const { id } = req.params;
            await metricService_1.metricService.deleteMetric(id);
            res.json({ message: 'Metric deleted successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete metric', details: error.message });
        }
    }
};
//# sourceMappingURL=metricController.js.map