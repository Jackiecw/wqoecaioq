import apiClient from './apiClient';

export interface CalendarEventDto {
    id: string | number;
    title: string;
    startAt: string;
    endAt?: string;
    isAllDay?: boolean;
    color?: string;
    createdByAdmin?: boolean;
    [key: string]: any;
}

export interface CalendarEventPayload {
    title: string;
    startAt: string;
    endAt?: string;
    isAllDay?: boolean;
    [key: string]: any;
}

export interface WeeklyFocusDto {
    id: string;
    content: string;
}

export const calendarService = {
    async listEvents(params: Record<string, any>): Promise<CalendarEventDto[]> {
        const res = await apiClient.get('/calendar/events', { params });
        return res.data || [];
    },
    async listAdminEvents(params: Record<string, any>): Promise<CalendarEventDto[]> {
        const res = await apiClient.get('/admin/calendar/events', { params });
        return res.data || [];
    },
    async createEvent(payload: CalendarEventPayload, isAdmin: boolean) {
        const url = isAdmin ? '/admin/calendar/events' : '/calendar/events';
        const res = await apiClient.post(url, payload);
        return res.data;
    },
    async updateEvent(id: string | number, payload: CalendarEventPayload, isAdmin: boolean) {
        const url = isAdmin ? `/admin/calendar/events/${id}` : `/calendar/events/${id}`;
        const res = await apiClient.put(url, payload);
        return res.data;
    },
    async deleteEvent(id: string | number, isAdmin: boolean) {
        const url = isAdmin ? `/admin/calendar/events/${id}` : `/calendar/events/${id}`;
        await apiClient.delete(url);
    },
    async listUsers() {
        const res = await apiClient.get('/admin/users');
        return res.data || [];
    },
    async getWeeklyFocus(weekStartDate: string) {
        const res = await apiClient.get('/calendar/weekly-focus', { params: { weekStartDate } });
        return res.data || {};
    },
    async updateWeeklyFocus(id: string, content: string) {
        const res = await apiClient.put(`/calendar/weekly-focus/${id}`, { content });
        return res.data as WeeklyFocusDto;
    },
};

export default calendarService;
