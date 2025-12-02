import prisma from '../../prismaClient';
import AppError from '../utils/AppError';
import { Prisma } from '@prisma/client';

export class PerformanceService {
    async getAllTemplates() {
        return await prisma.performanceTemplate.findMany({
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async createTemplate(data: any) {
        const { name, description, items } = data;

        const totalWeight = items.reduce((sum: number, item: any) => sum + item.weight, 0);
        if (Math.abs(totalWeight - 100) > 0.01) {
            throw new AppError(`总权重必须为 100。当前总和: ${totalWeight}`, 400);
        }

        return await prisma.performanceTemplate.create({
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

    async assignReview(data: any) {
        const { employeeId, templateId, month, managerId, directorId } = data;

        const [year, monthStr] = month.split('-');
        const monthDate = new Date(Date.UTC(parseInt(year), parseInt(monthStr) - 1, 1));

        const existing = await prisma.performanceReview.findUnique({
            where: {
                employeeId_month_templateId: {
                    employeeId,
                    month: monthDate,
                    templateId
                }
            }
        });

        if (existing) {
            throw new AppError('该用户当月已存在此模板的考核记录', 400);
        }

        const template = await prisma.performanceTemplate.findUnique({
            where: { id: templateId },
            include: { items: true }
        });

        if (!template) {
            throw new AppError('模板未找到', 404);
        }

        let finalDirectorId = directorId;
        if (!finalDirectorId) {
            const manager = await prisma.user.findUnique({
                where: { id: managerId },
                include: { manager: true }
            });
            if (manager && manager.managerId) {
                finalDirectorId = manager.managerId;
            }
        }

        return await prisma.performanceReview.create({
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

    async getMyReviews(userId: string) {
        return await prisma.performanceReview.findMany({
            where: { employeeId: userId },
            include: {
                template: { select: { name: true } },
                manager: { select: { nickname: true } },
                director: { select: { nickname: true } }
            },
            orderBy: { month: 'desc' }
        });
    }

    async getPendingReviews(userId: string) {
        return await prisma.performanceReview.findMany({
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

    async getReviewDetail(id: string, userId: string, userRole: string) {
        const review = await prisma.performanceReview.findUnique({
            where: { id },
            include: {
                items: true,
                employee: { select: { id: true, nickname: true, username: true } },
                manager: { select: { id: true, nickname: true } },
                director: { select: { id: true, nickname: true } },
                template: { select: { name: true, description: true } }
            }
        });

        if (!review) throw new AppError('考核记录未找到', 404);

        const isRelated = review.employeeId === userId || review.managerId === userId || review.directorId === userId;
        const isAdmin = userRole === 'admin' || userRole === 'superadmin';

        if (!isRelated && !isAdmin) {
            throw new AppError('权限不足', 403);
        }

        return review;
    }

    async updateReview(id: string, data: any) {
        const { status, items, summaryThisMonth, planNextMonth, companySuggestions } = data;

        const currentReview = await prisma.performanceReview.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!currentReview) throw new AppError('考核记录未找到', 404);

        if (items && items.length > 0) {
            const updatePromises = items.map((item: any) => {
                return prisma.performanceReviewItem.update({
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
            await prisma.$transaction(updatePromises);
        }

        const updatedItems = await prisma.performanceReviewItem.findMany({
            where: { reviewId: id }
        });

        let selfTotal = 0;
        let managerTotal = 0;
        let directorTotal = 0;

        updatedItems.forEach(item => {
            const w = item.weight / 100.0;
            if (item.selfScore != null) selfTotal += item.selfScore * w;
            if (item.managerScore != null) managerTotal += item.managerScore * w;
            if (item.directorScore != null) directorTotal += item.directorScore * w;
        });

        selfTotal = parseFloat(selfTotal.toFixed(2));
        managerTotal = parseFloat(managerTotal.toFixed(2));
        directorTotal = parseFloat(directorTotal.toFixed(2));

        let finalScore = managerTotal;
        if (currentReview.directorId && directorTotal > 0) {
            finalScore = directorTotal;
        }

        const updateData: any = {
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

        return await prisma.performanceReview.update({
            where: { id },
            data: updateData
        });
    }
}

export default new PerformanceService();
