import prisma from '../../prismaClient';
import { Platform, StoreStatus } from '@prisma/client';
import AppError from '../utils/AppError';

export class ManagementService {
    // --- Stores ---
    async getOptions() {
        return {
            platforms: Object.values(Platform),
            storeStatuses: Object.values(StoreStatus),
        };
    }

    async getAllStores() {
        return await prisma.store.findMany({
            orderBy: { name: 'asc' },
            include: { country: true }
        });
    }

    async getStoreById(id: string) {
        const store = await prisma.store.findUnique({ where: { id } });
        if (!store) throw new AppError('店铺未找到', 404);
        return store;
    }

    async createStore(data: any) {
        const { registeredAt, ...rest } = data;
        try {
            return await prisma.store.create({
                data: {
                    ...rest,
                    registeredAt: registeredAt ? new Date(registeredAt) : null,
                },
            });
        } catch (error: any) {
            if (error.code === 'P2002') throw new AppError('此店铺名称 (name) 已被占用', 400);
            if (error.code === 'P2003') throw new AppError('选择的国家 (Country Code) 无效', 400);
            throw error;
        }
    }

    async updateStore(id: string, data: any) {
        const { registeredAt, ...rest } = data;
        try {
            return await prisma.store.update({
                where: { id },
                data: {
                    ...rest,
                    registeredAt: registeredAt ? new Date(registeredAt) : null,
                },
            });
        } catch (error: any) {
            if (error.code === 'P2002') throw new AppError('此店铺名称 (name) 已被占用', 400);
            if (error.code === 'P2003') throw new AppError('选择的国家 (Country Code) 无效', 400);
            if (error.code === 'P2025') throw new AppError('店铺未找到', 404);
            throw error;
        }
    }

    async deleteStore(id: string) {
        const existing = await prisma.store.findUnique({ where: { id } });
        if (!existing) throw new AppError('店铺未找到', 404);

        await prisma.$transaction([
            prisma.salesData.deleteMany({ where: { storeId: id } }),
            prisma.expense.updateMany({
                where: { storeId: id },
                data: { storeId: null },
            }),
            prisma.store.delete({ where: { id } }),
        ]);
    }

    // --- Countries ---
    async getAllCountries() {
        return await prisma.managedCountry.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async createCountry(data: any) {
        const { establishedAt, ...rest } = data;
        try {
            return await prisma.managedCountry.create({
                data: {
                    ...rest,
                    establishedAt: establishedAt ? new Date(establishedAt) : null,
                },
            });
        } catch (error: any) {
            if (error.code === 'P2002') throw new AppError('此国家代码 (Code) 已被占用', 400);
            throw error;
        }
    }

    async updateCountry(id: string, data: any) {
        const { establishedAt, ...rest } = data;
        try {
            return await prisma.managedCountry.update({
                where: { id },
                data: {
                    ...rest,
                    establishedAt: establishedAt ? new Date(establishedAt) : null,
                },
            });
        } catch (error: any) {
            if (error.code === 'P2002') throw new AppError('此国家代码 (Code) 已被占用', 400);
            if (error.code === 'P2025') throw new AppError('国家未找到', 404);
            throw error;
        }
    }
}

export default new ManagementService();
