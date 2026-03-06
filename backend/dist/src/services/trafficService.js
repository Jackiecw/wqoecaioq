"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trafficService = void 0;
const prismaClient_1 = __importDefault(require("../../prismaClient"));
exports.trafficService = {
    async getAll(params) {
        const { startDate, endDate, storeId, page, pageSize } = params;
        const where = {};
        if (startDate && endDate) {
            where.recordDate = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        if (storeId) {
            where.storeId = storeId;
        }
        const total = await prismaClient_1.default.trafficData.count({ where });
        const data = await prismaClient_1.default.trafficData.findMany({
            where,
            include: {
                store: { select: { name: true, platform: true } },
                listing: { select: { productCode: true, storeTitle: true } },
                enteredBy: { select: { nickname: true } }
            },
            orderBy: { recordDate: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize
        });
        return { data, total, page, pageSize };
    },
    async create(data) {
        return prismaClient_1.default.trafficData.create({
            data: {
                ...data,
                recordDate: new Date(data.recordDate)
            }
        });
    },
    async update(id, data) {
        return prismaClient_1.default.trafficData.update({
            where: { id },
            data: {
                ...data,
                recordDate: data.recordDate ? new Date(data.recordDate) : undefined
            }
        });
    },
    async delete(id) {
        return prismaClient_1.default.trafficData.delete({
            where: { id }
        });
    }
};
//# sourceMappingURL=trafficService.js.map