"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class ReportService {
    async getReports(user) {
        const { role, userId } = user;
        const where = {};
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
        return await prismaClient_1.default.weeklyReport.findMany({
            where,
            include: { author: { select: { nickname: true } } },
            orderBy: { weekStartDate: 'desc' }
        });
    }
    async createReport(data, userId) {
        const { weekStartDate, summaryThisWeek, planNextWeek, problemsEncountered, other } = data;
        // Check if report already exists for this week?
        // Optional.
        return await prismaClient_1.default.weeklyReport.create({
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
    async deleteReport(id, userId, role) {
        const report = await prismaClient_1.default.weeklyReport.findUnique({ where: { id } });
        if (!report)
            throw new AppError_1.default('Report not found', 404);
        if (role !== 'admin' && report.authorId !== userId) {
            throw new AppError_1.default('Permission denied', 403);
        }
        await prismaClient_1.default.weeklyReport.delete({ where: { id } });
    }
}
exports.ReportService = ReportService;
exports.default = new ReportService();
//# sourceMappingURL=reportService.js.map