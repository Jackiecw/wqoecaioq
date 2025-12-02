"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceService = void 0;
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class PerformanceService {
    async getAllTemplates() {
        return await prismaClient_1.default.performanceTemplate.findMany({
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async createTemplate(data) {
        const { name, description, items } = data;
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        if (Math.abs(totalWeight - 100) > 0.01) {
            throw new AppError_1.default(`总权重必须为 100。当前总和: ${totalWeight}`, 400);
        }
        return await prismaClient_1.default.performanceTemplate.create({
            data: {
                name,
                description,
                items: {
                    create: items
                }
            },
            include: { items: true }
        });
    }
    async assignReview(data) {
        const { employeeId, templateId, month, managerId, directorId } = data;
        const [year, monthStr] = month.split('-');
        const monthDate = new Date(Date.UTC(parseInt(year), parseInt(monthStr) - 1, 1));
        const existing = await prismaClient_1.default.performanceReview.findUnique({
            where: {
                employeeId_month_templateId: {
                    employeeId,
                    month: monthDate,
                    templateId
                }
            }
        });
        if (existing) {
            throw new AppError_1.default('该用户当月已存在此模板的考核记录', 400);
        }
        const template = await prismaClient_1.default.performanceTemplate.findUnique({
            where: { id: templateId },
            include: { items: true }
        });
        if (!template) {
            throw new AppError_1.default('模板未找到', 404);
        }
        let finalDirectorId = directorId;
        if (!finalDirectorId) {
            const manager = await prismaClient_1.default.user.findUnique({
                where: { id: managerId },
                include: { manager: true }
            });
            if (manager && manager.managerId) {
                finalDirectorId = manager.managerId;
            }
        }
        return await prismaClient_1.default.performanceReview.create({
            data: {
                month: monthDate,
                status: 'SELF_REVIEW',
                employee: { connect: { id: employeeId } },
                manager: { connect: { id: managerId } },
                ...(finalDirectorId ? { director: { connect: { id: finalDirectorId } } } : {}),
                template: { connect: { id: templateId } },
                items: {
                    create: template.items.map(item => ({
                        category: item.category,
                        kpiName: item.kpiName,
                        description: item.description,
                        weight: item.weight
                    }))
                }
            }
        });
    }
    async getMyReviews(userId) {
        return await prismaClient_1.default.performanceReview.findMany({
            where: { employeeId: userId },
            include: {
                template: { select: { name: true } },
                manager: { select: { nickname: true } },
                director: { select: { nickname: true } }
            },
            orderBy: { month: 'desc' }
        });
    }
    async getPendingReviews(userId) {
        return await prismaClient_1.default.performanceReview.findMany({
            where: {
                OR: [
                    { managerId: userId, status: 'MANAGER_REVIEW' },
                    { directorId: userId, status: 'DIRECTOR_REVIEW' }
                ]
            },
            include: {
                employee: { select: { nickname: true, username: true } },
                template: { select: { name: true } }
            },
            orderBy: { month: 'desc' }
        });
    }
    async getReviewDetail(id, userId, userRole) {
        const review = await prismaClient_1.default.performanceReview.findUnique({
            where: { id },
            include: {
                items: true,
                employee: { select: { id: true, nickname: true, username: true } },
                manager: { select: { id: true, nickname: true } },
                director: { select: { id: true, nickname: true } },
                template: { select: { name: true, description: true } }
            }
        });
        if (!review)
            throw new AppError_1.default('考核记录未找到', 404);
        const isRelated = review.employeeId === userId || review.managerId === userId || review.directorId === userId;
        const isAdmin = userRole === 'admin' || userRole === 'superadmin';
        if (!isRelated && !isAdmin) {
            throw new AppError_1.default('权限不足', 403);
        }
        return review;
    }
    async updateReview(id, data) {
        const { status, items, summaryThisMonth, planNextMonth, companySuggestions } = data;
        const currentReview = await prismaClient_1.default.performanceReview.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!currentReview)
            throw new AppError_1.default('考核记录未找到', 404);
        if (items && items.length > 0) {
            const updatePromises = items.map((item) => {
                return prismaClient_1.default.performanceReviewItem.update({
                    where: { id: item.id },
                    data: {
                        selfScore: item.selfScore,
                        selfComment: item.selfComment,
                        managerScore: item.managerScore,
                        managerComment: item.managerComment,
                        directorScore: item.directorScore,
                        directorComment: item.directorComment,
                    }
                });
            });
            await prismaClient_1.default.$transaction(updatePromises);
        }
        const updatedItems = await prismaClient_1.default.performanceReviewItem.findMany({
            where: { reviewId: id }
        });
        let selfTotal = 0;
        let managerTotal = 0;
        let directorTotal = 0;
        updatedItems.forEach(item => {
            const w = item.weight / 100.0;
            if (item.selfScore != null)
                selfTotal += item.selfScore * w;
            if (item.managerScore != null)
                managerTotal += item.managerScore * w;
            if (item.directorScore != null)
                directorTotal += item.directorScore * w;
        });
        selfTotal = parseFloat(selfTotal.toFixed(2));
        managerTotal = parseFloat(managerTotal.toFixed(2));
        directorTotal = parseFloat(directorTotal.toFixed(2));
        let finalScore = managerTotal;
        if (currentReview.directorId && directorTotal > 0) {
            finalScore = directorTotal;
        }
        const updateData = {
            selfScoreTotal: selfTotal,
            managerScoreTotal: managerTotal,
            directorScoreTotal: directorTotal,
            finalScore: finalScore,
            summaryThisMonth: summaryThisMonth,
            planNextMonth: planNextMonth,
            companySuggestions: companySuggestions
        };
        if (status) {
            updateData.status = status;
        }
        return await prismaClient_1.default.performanceReview.update({
            where: { id },
            data: updateData
        });
    }
}
exports.PerformanceService = PerformanceService;
exports.default = new PerformanceService();
//# sourceMappingURL=performanceService.js.map