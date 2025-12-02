"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagementService = void 0;
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../utils/AppError"));
class ManagementService {
    // --- Stores ---
    async getOptions() {
        return {
            platforms: Object.values(client_1.Platform),
            storeStatuses: Object.values(client_1.StoreStatus),
        };
    }
    async getAllStores() {
        return await prismaClient_1.default.store.findMany({
            orderBy: { name: 'asc' },
            include: { country: true }
        });
    }
    async getStoreById(id) {
        const store = await prismaClient_1.default.store.findUnique({ where: { id } });
        if (!store)
            throw new AppError_1.default('店铺未找到', 404);
        return store;
    }
    async createStore(data) {
        const { registeredAt, ...rest } = data;
        try {
            return await prismaClient_1.default.store.create({
                data: {
                    ...rest,
                    registeredAt: registeredAt ? new Date(registeredAt) : null,
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002')
                throw new AppError_1.default('此店铺名称 (name) 已被占用', 400);
            if (error.code === 'P2003')
                throw new AppError_1.default('选择的国家 (Country Code) 无效', 400);
            throw error;
        }
    }
    async updateStore(id, data) {
        const { registeredAt, ...rest } = data;
        try {
            return await prismaClient_1.default.store.update({
                where: { id },
                data: {
                    ...rest,
                    registeredAt: registeredAt ? new Date(registeredAt) : null,
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002')
                throw new AppError_1.default('此店铺名称 (name) 已被占用', 400);
            if (error.code === 'P2003')
                throw new AppError_1.default('选择的国家 (Country Code) 无效', 400);
            if (error.code === 'P2025')
                throw new AppError_1.default('店铺未找到', 404);
            throw error;
        }
    }
    async deleteStore(id) {
        const existing = await prismaClient_1.default.store.findUnique({ where: { id } });
        if (!existing)
            throw new AppError_1.default('店铺未找到', 404);
        await prismaClient_1.default.$transaction([
            prismaClient_1.default.salesData.deleteMany({ where: { storeId: id } }),
            prismaClient_1.default.expense.updateMany({
                where: { storeId: id },
                data: { storeId: null },
            }),
            prismaClient_1.default.store.delete({ where: { id } }),
        ]);
    }
    // --- Countries ---
    async getAllCountries() {
        return await prismaClient_1.default.managedCountry.findMany({
            orderBy: { name: 'asc' },
        });
    }
    async createCountry(data) {
        const { establishedAt, ...rest } = data;
        try {
            return await prismaClient_1.default.managedCountry.create({
                data: {
                    ...rest,
                    establishedAt: establishedAt ? new Date(establishedAt) : null,
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002')
                throw new AppError_1.default('此国家代码 (Code) 已被占用', 400);
            throw error;
        }
    }
    async updateCountry(id, data) {
        const { establishedAt, ...rest } = data;
        try {
            return await prismaClient_1.default.managedCountry.update({
                where: { id },
                data: {
                    ...rest,
                    establishedAt: establishedAt ? new Date(establishedAt) : null,
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002')
                throw new AppError_1.default('此国家代码 (Code) 已被占用', 400);
            if (error.code === 'P2025')
                throw new AppError_1.default('国家未找到', 404);
            throw error;
        }
    }
}
exports.ManagementService = ManagementService;
exports.default = new ManagementService();
//# sourceMappingURL=managementService.js.map