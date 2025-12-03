import prisma from '../../prismaClient';
import AppError from '../utils/AppError';
import { getStartOfWeek, getPlanPreviewForWeek } from '../utils/dataHelpers';

const parseDate = (value: any, label: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        throw new AppError(`${label}格式无效`, 400);
    }
    return d;
};

class CalendarService {
    async listEvents(user: any, start: string, end: string) {
        const startDate = parseDate(start, 'start');
        const endDate = parseDate(end, 'end');

        return prisma.calendarEvent.findMany({
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

    async createEvent(user: any, data: any) {
        const { title, startAt, endAt, isAllDay = false, color } = data || {};
        if (!title || !startAt || !endAt) {
            throw new AppError('标题、开始时间、结束时间均为必填', 400);
        }
        const startDate = parseDate(startAt, '开始时间');
        const endDate = parseDate(endAt, '结束时间');
        if (endDate.getTime() < startDate.getTime()) {
            throw new AppError('结束时间不能早于开始时间', 400);
        }

        return prisma.calendarEvent.create({
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

    async updateEvent(user: any, id: string, data: any) {
        const event = await prisma.calendarEvent.findUnique({ where: { id } });
        if (!event) throw new AppError('日程不存在', 404);
        const isOwner = event.authorId === user.userId;
        const isAdmin = user.role === 'admin';
        if (!isOwner && !isAdmin) {
            throw new AppError('无权修改该日程', 403);
        }
        if (event.createdByAdmin && !isAdmin) {
            throw new AppError('管理员指派的日程只能由管理员修改', 403);
        }

        const payload: any = {};
        if (data.title !== undefined) payload.title = data.title;
        if (data.isAllDay !== undefined) payload.isAllDay = !!data.isAllDay;
        if (data.color !== undefined) payload.color = data.color;
        if (data.startAt) payload.startAt = parseDate(data.startAt, '开始时间');
        if (data.endAt) payload.endAt = parseDate(data.endAt, '结束时间');

        if (payload.startAt && payload.endAt && payload.endAt.getTime() < payload.startAt.getTime()) {
            throw new AppError('结束时间不能早于开始时间', 400);
        }

        return prisma.calendarEvent.update({
            where: { id },
            data: payload,
        });
    }

    async deleteEvent(user: any, id: string) {
        const event = await prisma.calendarEvent.findUnique({ where: { id } });
        if (!event) return;
        const isOwner = event.authorId === user.userId;
        const isAdmin = user.role === 'admin';
        if (!isOwner && !isAdmin) {
            throw new AppError('无权删除该日程', 403);
        }
        if (event.createdByAdmin && !isAdmin) {
            throw new AppError('管理员指派的日程只能由管理员删除', 403);
        }
        await prisma.calendarEvent.delete({ where: { id } });
    }

    async getWeeklyFocus(user: any, weekStart?: string) {
        const start = weekStart ? parseDate(weekStart, 'weekStartDate') : getStartOfWeek();
        start.setHours(0, 0, 0, 0);

        let focus = await prisma.weeklyFocus.findUnique({
            where: { weekStartDate: start },
        });

        if (!focus && user.role === 'admin') {
            focus = await prisma.weeklyFocus.create({
                data: {
                    weekStartDate: start,
                    content: '',
                    authorId: user.userId,
                },
            });
        }

        const userPlan = await getPlanPreviewForWeek(user.userId, start);

        return { focus, userPlan: userPlan || '' };
    }

    async updateWeeklyFocus(user: any, id: string, content: string) {
        if (user.role !== 'admin') {
            throw new AppError('仅管理员可以更新团队聚焦', 403);
        }
        if (!content && content !== '') {
            throw new AppError('内容不能为空', 400);
        }
        const focus = await prisma.weeklyFocus.findUnique({ where: { id } });
        if (!focus) throw new AppError('本周聚焦不存在', 404);
        return prisma.weeklyFocus.update({
            where: { id },
            data: {
                content: content || '',
                authorId: user.userId,
            },
        });
    }
}

export default new CalendarService();
