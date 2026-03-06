import { Request, Response } from 'express';
import { metricService } from '../services/metricService';
import { z } from 'zod';

const createMetricSchema = z.object({
    type: z.enum(['ADVERTISING', 'TRAFFIC']),
    name: z.string().min(1),
    label: z.string().min(1),
    isActive: z.boolean().optional(),
    order: z.number().int().optional()
});

const updateMetricSchema = z.object({
    label: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().optional()
});

export const metricController = {
    async getAllMetrics(req: Request, res: Response) {
        try {
            const { type } = req.query;
            const metrics = await metricService.getAllMetrics(type as any);
            res.json(metrics);
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch metrics', details: error.message });
        }
    },

    async getActiveMetrics(req: Request, res: Response) {
        try {
            const { type } = req.query;
            if (!type || (type !== 'ADVERTISING' && type !== 'TRAFFIC')) {
                return res.status(400).json({ error: 'Invalid or missing type parameter' });
            }
            const metrics = await metricService.getActiveMetrics(type as any);
            res.json(metrics);
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch active metrics', details: error.message });
        }
    },

    async createMetric(req: Request, res: Response) {
        try {
            const validatedData = createMetricSchema.parse(req.body);
            const newMetric = await metricService.createMetric(validatedData);
            res.status(201).json(newMetric);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: 'Failed to create metric', details: error.message });
        }
    },

    async updateMetric(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const validatedData = updateMetricSchema.parse(req.body);
            const updatedMetric = await metricService.updateMetric(id, validatedData);
            res.json(updatedMetric);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: 'Failed to update metric', details: error.message });
        }
    },

    async deleteMetric(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await metricService.deleteMetric(id);
            res.json({ message: 'Metric deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to delete metric', details: error.message });
        }
    }
};
