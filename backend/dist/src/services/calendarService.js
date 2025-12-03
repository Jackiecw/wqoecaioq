"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const dataHelpers_1 = require("../utils/dataHelpers");
const parseDate = (value, label) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        throw new AppError_1.default(`${label}格式无效`, 400);
    }
    return d;
};
class CalendarService {
    async listEvents(user, start, end) {
        const startDate = parseDate(start, 'start');
        const endDate = parseDate(end, 'end');
        return prismaClient_1.default.calendarEvent.findMany({
            where: {
                startAt: { lt: endDate },
                endAt: { gt: startDate },
                OR: [
                    { authorId: user.userId },
                    { createdByAdmin: true },
                ],
            },
            orderBy: { startAt: 'asc' },
        });
    }
    async createEvent(user, data) {
        const { title, startAt, endAt, isAllDay = false, color } = data || {};
        if (!title || !startAt || !endAt) {
            throw new AppError_1.default('标题、开始时间、结束时间均为必填', 400);
        }
        const startDate = parseDate(startAt, '开始时间');
        const endDate = parseDate(endAt, '结束时间');
        if (endDate.getTime() < startDate.getTime()) {
            throw new AppError_1.default('结束时间不能早于开始时间', 400);
        }
        return prismaClient_1.default.calendarEvent.create({
            data: {
                title,
                startAt: startDate,
                endAt: endDate,
                isAllDay: !!isAllDay,
                color: color || 'blue',
                authorId: user.userId,
                createdByAdmin: false,
            },
        });
    }
    async updateEvent(user, id, data) {
        const event = await prismaClient_1.default.calendarEvent.findUnique({ where: { id } });
        if (!event)
            throw new AppError_1.default('日程不存在', 404);
        const isOwner = event.authorId === user.userId;
        const isAdmin = user.role === 'admin';
        if (!isOwner && !isAdmin) {
            throw new AppError_1.default('无权修改该日程', 403);
        }
        if (event.createdByAdmin && !isAdmin) {
            throw new AppError_1.default('管理员指派的日程只能由管理员修改', 403);
        }
        const payload = {};
        if (data.title !== undefined)
            payload.title = data.title;
        if (data.isAllDay !== undefined)
            payload.isAllDay = !!data.isAllDay;
        if (data.color !== undefined)
            payload.color = data.color;
        if (data.startAt)
            payload.startAt = parseDate(data.startAt, '开始时间');
        if (data.endAt)
            payload.endAt = parseDate(data.endAt, '结束时间');
        if (payload.startAt && payload.endAt && payload.endAt.getTime() < payload.startAt.getTime()) {
            throw new AppError_1.default('结束时间不能早于开始时间', 400);
        }
        return prismaClient_1.default.calendarEvent.update({
            where: { id },
            data: payload,
        });
    }
    async deleteEvent(user, id) {
        const event = await prismaClient_1.default.calendarEvent.findUnique({ where: { id } });
        if (!event)
            return;
        const isOwner = event.authorId === user.userId;
        const isAdmin = user.role === 'admin';
        if (!isOwner && !isAdmin) {
            throw new AppError_1.default('无权删除该日程', 403);
        }
        if (event.createdByAdmin && !isAdmin) {
            throw new AppError_1.default('管理员指派的日程只能由管理员删除', 403);
        }
        await prismaClient_1.default.calendarEvent.delete({ where: { id } });
    }
    async getWeeklyFocus(user, weekStart) {
        const start = weekStart ? parseDate(weekStart, 'weekStartDate') : (0, dataHelpers_1.getStartOfWeek)();
        start.setHours(0, 0, 0, 0);
        let focus = await prismaClient_1.default.weeklyFocus.findUnique({
            where: { weekStartDate: start },
        });
        if (!focus && user.role === 'admin') {
            focus = await prismaClient_1.default.weeklyFocus.create({
                data: {
                    weekStartDate: start,
                    content: '',
                    authorId: user.userId,
                },
            });
        }
        const userPlan = await (0, dataHelpers_1.getPlanPreviewForWeek)(user.userId, start);
        return { focus, userPlan: userPlan || '' };
    }
    async updateWeeklyFocus(user, id, content) {
        if (user.role !== 'admin') {
            throw new AppError_1.default('仅管理员可以更新团队聚焦', 403);
        }
        if (!content && content !== '') {
            throw new AppError_1.default('内容不能为空', 400);
        }
        const focus = await prismaClient_1.default.weeklyFocus.findUnique({ where: { id } });
        if (!focus)
            throw new AppError_1.default('本周聚焦不存在', 404);
        return prismaClient_1.default.weeklyFocus.update({
            where: { id },
            data: {
                content: content || '',
                authorId: user.userId,
            },
        });
    }
}
exports.default = new CalendarService();
//# sourceMappingURL=calendarService.js.map