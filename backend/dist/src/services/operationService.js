"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationService = void 0;
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class OperationService {
    async getModules(countryCode) {
        return await prismaClient_1.default.operationModule.findMany({
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
    async getCountries() {
        return await prismaClient_1.default.managedCountry.findMany({
            orderBy: { name: 'asc' }
        });
    }
    async getLinks() {
        return await prismaClient_1.default.commonLink.findMany({
            orderBy: { displayOrder: 'asc' }
        });
    }
    async createModule(data) {
        const { name, ownerId, countryCode } = data;
        const maxOrder = await prismaClient_1.default.operationModule.aggregate({
            _max: { displayOrder: true },
            where: { countryCode },
        });
        const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;
        return await prismaClient_1.default.operationModule.create({
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
    async createTask(data) {
        const { name, ownerId, notes, moduleId } = data;
        const maxOrder = await prismaClient_1.default.operationTask.aggregate({
            _max: { displayOrder: true },
            where: { moduleId },
        });
        const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;
        return await prismaClient_1.default.operationTask.create({
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
    async updateTask(id, data) {
        const payload = {};
        if (data.name !== undefined)
            payload.name = data.name;
        if (data.notes !== undefined)
            payload.notes = data.notes;
        if (data.ownerId !== undefined)
            payload.ownerId = data.ownerId;
        try {
            return await prismaClient_1.default.operationTask.update({
                where: { id },
                data: payload,
                include: {
                    owner: { select: { id: true, nickname: true } }
                }
            });
        }
        catch (error) {
            if (error.code === 'P2025')
                throw new AppError_1.default('事项未找到', 404);
            throw error;
        }
    }
    async updateModule(id, data) {
        const payload = {};
        if (data.name !== undefined)
            payload.name = data.name;
        if (data.ownerId !== undefined)
            payload.ownerId = data.ownerId;
        try {
            return await prismaClient_1.default.operationModule.update({
                where: { id },
                data: payload,
                include: {
                    owner: { select: { id: true, nickname: true } }
                }
            });
        }
        catch (error) {
            if (error.code === 'P2025')
                throw new AppError_1.default('板块未找到', 404);
            throw error;
        }
    }
    async deleteTask(id) {
        try {
            await prismaClient_1.default.operationTask.delete({ where: { id } });
        }
        catch (error) {
            if (error.code === 'P2025')
                throw new AppError_1.default('事项未找到', 404);
            throw error;
        }
    }
    async deleteModule(id) {
        try {
            await prismaClient_1.default.operationModule.delete({ where: { id } });
        }
        catch (error) {
            if (error.code === 'P2025')
                throw new AppError_1.default('板块未找到', 404);
            throw error;
        }
    }
}
exports.OperationService = OperationService;
exports.default = new OperationService();
//# sourceMappingURL=operationService.js.map