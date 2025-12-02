import prisma from '../../prismaClient';
import AppError from '../utils/AppError';

export class ReportService {
    async getReports(user: any) {
        const { role, userId } = user;
        const where: any = {};

        // Non-admins can only see their own reports
        // Or maybe they can see all? The requirement isn't clear.
        // Usually weekly reports are visible to team.
        // But let's restrict to own for now unless admin.
        // Wait, ViewReports.vue has "canViewReports" permission check.
        // If user has 'VIEW_REPORTS' permission, they might see all.
        // But for now, let's stick to: Admin sees all, User sees own.

        if (role !== 'admin') {
            // If we had a permission system, we'd check it here.
            // For now, assume only admin sees all.
            where.authorId = userId;
        }

        return await prisma.weeklyReport.findMany({
            where,
            include: { author: { select: { nickname: true } } },
            orderBy: { weekStartDate: 'desc' }
        });
    }

    async createReport(data: any, userId: string) {
        const { weekStartDate, summaryThisWeek, planNextWeek, problemsEncountered, other } = data;

        // Check if report already exists for this week?
        // Optional.

        return await prisma.weeklyReport.create({
            data: {
                weekStartDate: new Date(weekStartDate),
                summaryThisWeek,
                planNextWeek,
                problemsEncountered,
                other,
                author: { connect: { id: userId } }
            }
        });
    }

    async deleteReport(id: string, userId: string, role: string) {
        const report = await prisma.weeklyReport.findUnique({ where: { id } });
        if (!report) throw new AppError('Report not found', 404);

        if (role !== 'admin' && report.authorId !== userId) {
            throw new AppError('Permission denied', 403);
        }

        await prisma.weeklyReport.delete({ where: { id } });
    }
}

export default new ReportService();
