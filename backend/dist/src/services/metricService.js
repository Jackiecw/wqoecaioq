"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricService = void 0;
const prismaClient_1 = __importDefault(require("../../prismaClient"));
exports.metricService = {
    async getAllMetrics(type) {
        return prismaClient_1.default.metricDefinition.findMany({
            where: type ? { type } : undefined,
            orderBy: [
                { type: 'asc' },
                { order: 'asc' },
                { createdAt: 'desc' }
            ]
        });
    },
    async getActiveMetrics(type) {
        return prismaClient_1.default.metricDefinition.findMany({
            where: {
                type,
                isActive: true
            },
            orderBy: { order: 'asc' }
        });
    },
    async createMetric(data) {
        // 检查 name 是否已存在（同一类型下）
        const existing = await prismaClient_1.default.metricDefinition.findUnique({
            where: {
                type_name: {
                    type: data.type,
                    name: data.name
                }
            }
        });
        if (existing) {
            throw new Error(`The metric name '${data.name}' already exists for type ${data.type}`);
        }
        return prismaClient_1.default.metricDefinition.create({
            data
        });
    },
    async updateMetric(id, data) {
        return prismaClient_1.default.metricDefinition.update({
            where: { id },
            data
        });
    },
    async deleteMetric(id) {
        return prismaClient_1.default.metricDefinition.delete({
            where: { id }
        });
    }
};
//# sourceMappingURL=metricService.js.map