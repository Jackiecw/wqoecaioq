import prisma from '../../prismaClient';

interface CreateMetricInput {
    type: 'ADVERTISING' | 'TRAFFIC';
    name: string;
    label: string;
    isActive?: boolean;
    order?: number;
}

interface UpdateMetricInput {
    label?: string;
    isActive?: boolean;
    order?: number;
}

export const metricService = {
    async getAllMetrics(type?: 'ADVERTISING' | 'TRAFFIC') {
        return prisma.metricDefinition.findMany({
            where: type ? { type } : undefined,
            orderBy: [
                { type: 'asc' },
                { order: 'asc' },
                { createdAt: 'desc' }
            ]
        });
    },

    async getActiveMetrics(type: 'ADVERTISING' | 'TRAFFIC') {
        return prisma.metricDefinition.findMany({
            where: {
                type,
                isActive: true
            },
            orderBy: { order: 'asc' }
        });
    },

    async createMetric(data: CreateMetricInput) {
        // 检查 name 是否已存在（同一类型下）
        const existing = await prisma.metricDefinition.findUnique({
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

        return prisma.metricDefinition.create({
            data
        });
    },

    async updateMetric(id: string, data: UpdateMetricInput) {
        return prisma.metricDefinition.update({
            where: { id },
            data
        });
    },

    async deleteMetric(id: string) {
        return prisma.metricDefinition.delete({
            where: { id }
        });
    }
};
