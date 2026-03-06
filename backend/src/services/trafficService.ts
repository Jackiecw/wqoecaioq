import prisma from '../../prismaClient';

interface CreateTrafficInput {
    recordDate: string | Date;
    storeId: string;
    listingId?: string | null;
    enteredById: string;
    metrics: Record<string, any>;
    notes?: string | null;
}

interface UpdateTrafficInput {
    recordDate?: string | Date;
    storeId?: string;
    listingId?: string | null;
    metrics?: Record<string, any>;
    notes?: string | null;
}

export const trafficService = {
    async getAll(params: {
        startDate?: string;
        endDate?: string;
        storeId?: string;
        page: number;
        pageSize: number;
    }) {
        const { startDate, endDate, storeId, page, pageSize } = params;

        const where: any = {};
        if (startDate && endDate) {
            where.recordDate = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        if (storeId) {
            where.storeId = storeId;
        }

        const total = await prisma.trafficData.count({ where });
        const data = await prisma.trafficData.findMany({
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

    async create(data: CreateTrafficInput) {
        return prisma.trafficData.create({
            data: {
                ...data,
                recordDate: new Date(data.recordDate)
            }
        });
    },

    async update(id: string, data: UpdateTrafficInput) {
        return prisma.trafficData.update({
            where: { id },
            data: {
                ...data,
                recordDate: data.recordDate ? new Date(data.recordDate) : undefined
            }
        });
    },

    async delete(id: string) {
        return prisma.trafficData.delete({
            where: { id }
        });
    }
};
