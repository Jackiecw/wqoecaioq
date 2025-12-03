import apiClient from './apiClient';

export interface WeeklyReport {
    id: string;
    weekStartDate: string;
    createdAt: string;
    author: {
        nickname: string;
    };
    summaryThisWeek?: string;
    planNextWeek?: string;
    problemsEncountered?: string | null;
    other?: string | null;
}

export interface WeeklyReportPayload {
    weekStartDate: string;
    summaryThisWeek: string;
    planNextWeek: string;
    problemsEncountered?: string;
    other?: string;
}

export const reportService = {
    async create(payload: WeeklyReportPayload) {
        const response = await apiClient.post('/reports', payload);
        return response.data as WeeklyReport;
    },
    async list() {
        const response = await apiClient.get('/reports');
        return response.data as WeeklyReport[];
    },
    async remove(id: string) {
        await apiClient.delete(`/reports/${id}`);
    },
};

export default reportService;
