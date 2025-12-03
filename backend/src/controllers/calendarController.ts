import { Request, Response, NextFunction } from 'express';
import calendarService from '../services/calendarService';
import AppError from '../utils/AppError';

class CalendarController {
    async listEvents(req: Request, res: Response, next: NextFunction) {
        try {
            const { start, end } = req.query;
            if (!start || !end) {
                throw new AppError('必须提供 start 和 end 查询参数', 400);
            }
            const events = await calendarService.listEvents((req as any).user, start as string, end as string);
            res.json(events);
        } catch (error) {
            next(error);
        }
    }

    async createEvent(req: Request, res: Response, next: NextFunction) {
        try {
            const event = await calendarService.createEvent((req as any).user, req.body || {});
            res.status(201).json(event);
        } catch (error) {
            next(error);
        }
    }

    async updateEvent(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params.id) throw new AppError('缺少日程ID', 400);
            const event = await calendarService.updateEvent((req as any).user, req.params.id, req.body || {});
            res.json(event);
        } catch (error) {
            next(error);
        }
    }

    async deleteEvent(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params.id) throw new AppError('缺少日程ID', 400);
            await calendarService.deleteEvent((req as any).user, req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async getWeeklyFocus(req: Request, res: Response, next: NextFunction) {
        try {
            const { weekStartDate } = req.query;
            const data = await calendarService.getWeeklyFocus((req as any).user, weekStartDate as string | undefined);
            res.json(data);
        } catch (error) {
            next(error);
        }
    }

    async updateWeeklyFocus(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params.id) throw new AppError('缺少聚焦ID', 400);
            const { content = '' } = req.body || {};
            const updated = await calendarService.updateWeeklyFocus((req as any).user, req.params.id, content);
            res.json(updated);
        } catch (error) {
            next(error);
        }
    }
}

export default new CalendarController();
