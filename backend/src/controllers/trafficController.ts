import { Request, Response } from 'express';
import { trafficService } from '../services/trafficService';
import { z } from 'zod';

const createTrafficSchema = z.object({
    recordDate: z.string().or(z.date()),
    storeId: z.string().min(1),
    listingId: z.string().optional().nullable(),
    metrics: z.record(z.any()),
    notes: z.string().optional().nullable()
});

const updateTrafficSchema = z.object({
    recordDate: z.string().or(z.date()).optional(),
    storeId: z.string().optional(),
    listingId: z.string().optional().nullable(),
    metrics: z.record(z.any()).optional(),
    notes: z.string().optional().nullable()
});

export const trafficController = {
    async getAll(req: Request, res: Response) {
        try {
            const { startDate, endDate, storeId, page = '1', pageSize = '50' } = req.query;
            const parsedPage = parseInt(page as string, 10);
            const parsedPageSize = parseInt(pageSize as string, 10);

            const data = await trafficService.getAll({
                startDate: startDate as string,
                endDate: endDate as string,
                storeId: storeId as string,
                page: isNaN(parsedPage) ? 1 : parsedPage,
                pageSize: isNaN(parsedPageSize) ? 50 : parsedPageSize
            });
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch traffic data', details: error.message });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const validatedData = createTrafficSchema.parse(req.body);
            const enteredById = (req as any).user?.id;
            if (!enteredById) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const newData = await trafficService.create({
                ...validatedData,
                enteredById
            });
            res.status(201).json(newData);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: 'Failed to create traffic data', details: error.message });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const validatedData = updateTrafficSchema.parse(req.body);
            const updatedData = await trafficService.update(id, validatedData);
            res.json(updatedData);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: 'Failed to update traffic data', details: error.message });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await trafficService.delete(id);
            res.json({ message: 'Traffic data deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to delete traffic data', details: error.message });
        }
    }
};
