import prisma from '../../prismaClient';
import AppError from '../utils/AppError';

export class OperationService {
    async getModules(countryCode: string) {
        return await prisma.operationModule.findMany({
            where: { countryCode },
            orderBy: { displayOrder: 'asc' },
            include: {
                owner: { select: { id: true, nickname: true } },
                tasks: {
                    orderBy: { displayOrder: 'asc' },
                    include: {
                        owner: { select: { id: true, nickname: true } }
                    }
                },
            },
        });
    }

    async createModule(data: any) {
        const { name, ownerId, countryCode } = data;

        const maxOrder = await prisma.operationModule.aggregate({
            _max: { displayOrder: true },
            where: { countryCode },
        });
        const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

        return await prisma.operationModule.create({
            data: {
                name,
                country: { connect: { code: countryCode } },
                displayOrder: nextOrder,
                owner: ownerId ? { connect: { id: ownerId } } : undefined,
            },
            include: {
                tasks: true,
                owner: { select: { id: true, nickname: true } }
            }
        });
    }

    async createTask(data: any) {
        const { name, ownerId, notes, moduleId } = data;

        const maxOrder = await prisma.operationTask.aggregate({
            _max: { displayOrder: true },
            where: { moduleId },
        });
        const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

        return await prisma.operationTask.create({
            data: {
                name,
                notes,
                module: { connect: { id: moduleId } },
                displayOrder: nextOrder,
                owner: ownerId ? { connect: { id: ownerId } } : undefined,
            },
            include: {
                owner: { select: { id: true, nickname: true } }
            }
        });
    }

    async updateTask(id: string, data: any) {
        const payload: any = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.notes !== undefined) payload.notes = data.notes;
        if (data.ownerId !== undefined) payload.ownerId = data.ownerId;

        try {
            return await prisma.operationTask.update({
                where: { id },
                data: payload,
                include: {
                    owner: { select: { id: true, nickname: true } }
                }
            });
        } catch (error: any) {
            if (error.code === 'P2025') throw new AppError('事项未找到', 404);
            throw error;
        }
    }

    async updateModule(id: string, data: any) {
        const payload: any = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.ownerId !== undefined) payload.ownerId = data.ownerId;

        try {
            return await prisma.operationModule.update({
                where: { id },
                data: payload,
                include: {
                    owner: { select: { id: true, nickname: true } }
                }
            });
        } catch (error: any) {
            if (error.code === 'P2025') throw new AppError('板块未找到', 404);
            throw error;
        }
    }

    async deleteTask(id: string) {
        try {
            await prisma.operationTask.delete({ where: { id } });
        } catch (error: any) {
            if (error.code === 'P2025') throw new AppError('事项未找到', 404);
            throw error;
        }
    }

    async deleteModule(id: string) {
        try {
            await prisma.operationModule.delete({ where: { id } });
        } catch (error: any) {
            if (error.code === 'P2025') throw new AppError('板块未找到', 404);
            throw error;
        }
    }
}

export default new OperationService();
