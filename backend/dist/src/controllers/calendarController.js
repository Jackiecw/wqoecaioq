"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const calendarService_1 = __importDefault(require("../services/calendarService"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class CalendarController {
    async listEvents(req, res, next) {
        try {
            const { start, end } = req.query;
            if (!start || !end) {
                throw new AppError_1.default('必须提供 start 和 end 查询参数', 400);
            }
            const events = await calendarService_1.default.listEvents(req.user, start, end);
            res.json(events);
        }
        catch (error) {
            next(error);
        }
    }
    async createEvent(req, res, next) {
        try {
            const event = await calendarService_1.default.createEvent(req.user, req.body || {});
            res.status(201).json(event);
        }
        catch (error) {
            next(error);
        }
    }
    async updateEvent(req, res, next) {
        try {
            if (!req.params.id)
                throw new AppError_1.default('缺少日程ID', 400);
            const event = await calendarService_1.default.updateEvent(req.user, req.params.id, req.body || {});
            res.json(event);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteEvent(req, res, next) {
        try {
            if (!req.params.id)
                throw new AppError_1.default('缺少日程ID', 400);
            await calendarService_1.default.deleteEvent(req.user, req.params.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    async getWeeklyFocus(req, res, next) {
        try {
            const { weekStartDate } = req.query;
            const data = await calendarService_1.default.getWeeklyFocus(req.user, weekStartDate);
            res.json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async updateWeeklyFocus(req, res, next) {
        try {
            if (!req.params.id)
                throw new AppError_1.default('缺少聚焦ID', 400);
            const { content = '' } = req.body || {};
            const updated = await calendarService_1.default.updateWeeklyFocus(req.user, req.params.id, content);
            res.json(updated);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new CalendarController();
//# sourceMappingURL=calendarController.js.map