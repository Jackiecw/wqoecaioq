import prisma from '../../prismaClient';
import { ProductionOrderStatus, LogisticsBillingMethod, Prisma } from '@prisma/client';
import AppError from '../utils/AppError';
import * as xlsx from 'xlsx';

// --- Constants ---
const STATUS_FLOW = [
    ProductionOrderStatus.PENDING,
    ProductionOrderStatus.IN_PRODUCTION,
    ProductionOrderStatus.READY,
    ProductionOrderStatus.SHIPPED,
];

const STATUS_LABELS: Record<string, string> = {
    PENDING: '待下单',
    IN_PRODUCTION: '生产中',
    READY: '待出库',
    SHIPPED: '已出库',
};

// --- Helper Functions ---
const pad = (num: number = 0, width: number = 2) => num.toString().padStart(width, '0');
const roundPrice = (value: number = 0) => Math.round(Number(value || 0) * 100) / 100;

function calcTotalPrice(quantity: number | null | undefined, unitPrice: number | null | undefined) {
    return roundPrice(Number(quantity || 0) * Number(unitPrice || 0));
}

function calcLogisticsFee(input: any) {
    const method = input.billingMethod;
    if (!method) return input.logisticsFee ?? null;
    if (method === LogisticsBillingMethod.FLAT_FEE) {
        return input.logisticsFee ?? null;
    }
    const unit = Number(input.logisticsUnitPrice || 0);
    if (!unit) return null;
    if (method === LogisticsBillingMethod.BY_CBM) {
        const base = Number(input.billingCbm ?? input.totalCbm ?? 0);
        return roundPrice(base * unit);
    }
    if (method === LogisticsBillingMethod.BY_WEIGHT) {
        const base = Number(input.billingKg ?? input.totalKg ?? 0);
        return roundPrice(base * unit);
    }
    return input.logisticsFee ?? null;
}

function summarizeOrders(orders: any[] = []) {
    return orders.reduce(
        (acc, order) => {
            acc.totalQuantity += Number(order.quantity || 0);
            acc.totalPrice += Number(order.totalPrice || 0);
            acc.totalCartons += Number(order.cartonCount || 0);
            acc.totalCbm += Number(order.totalCbm || 0);
            acc.totalBillingKg += Number(order.billingKg || 0);
            acc.totalBillingCbm += Number(order.billingCbm || 0);
            return acc;
        },
        {
            totalQuantity: 0,
            totalPrice: 0,
            totalCartons: 0,
            totalCbm: 0,
            totalBillingKg: 0,
            totalBillingCbm: 0,
        }
    );
}

function sortStatusEvents(events: any[] = []) {
    const orderMap = new Map(STATUS_FLOW.map((s, idx) => [s, idx]));
    return [...events].sort((a, b) => {
        const orderDiff = (orderMap.get(a.status) ?? 0) - (orderMap.get(b.status) ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
    });
}

function mapOrderListItem(order: any) {
    const batchCode = order.batch ? `${order.batch.countryCode}${pad(order.batch.batchSequence)}` : 'N/A';
    const currentStatusEvent = order.statusEvents?.find((e: any) => e.status === order.status);

    return {
        id: order.id,
        orderCode: order.orderCode,
        orderDate: order.orderDate,
        status: order.status,
        statusDate: currentStatusEvent?.occurredAt || null,
        batchId: order.batchId,
        batchNumber: order.batch?.batchNumber,
        batchCode,
        salesRegion: order.salesRegion,
        skuName: order.skuName,
        productName: order.product?.name || '',
        productColor: order.productColor,
        productSpec: order.productSpec,
        plugSpec: order.plugSpec,
        quantity: order.quantity,
        unitPrice: order.unitPrice,
        totalPrice: order.totalPrice,
        logisticsProvider: order.logisticsProvider,
        warehousingProvider: order.warehousingProvider,
        cartonCount: order.cartonCount,
        totalCbm: order.totalCbm,
        logisticsFee: order.logisticsFee,
    };
}

async function buildProductSnapshotMap(tx: any, productIds: string[] = []) {
    const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, sku: true, name: true },
    });
    const map = new Map();
    products.forEach((p: any) => map.set(p.id, p));
    return map;
}

export class LogisticsService {

    async getBatches() {
        const batches = await prisma.productionBatch.findMany({
            where: { deletedAt: null },
            orderBy: [{ createdAt: 'desc' }],
            include: {
                orders: {
                    where: { deletedAt: null },
                    include: {
                        product: { select: { sku: true, name: true } },
                        statusEvents: true,
                    },
                },
            },
        });

        const batchList = batches.map((batch) => {
            const stats = summarizeOrders(batch.orders);
            return {
                ...batch,
                batchCode: `${batch.countryCode}${pad(batch.batchSequence)}`,
                stats,
            };
        });

        const overall = summarizeOrders(batches.flatMap((b) => b.orders || []));
        return { batches: batchList, overall };
    }

    async getOrders(filters: any) {
        const { page = 1, pageSize = 20, view, keyword, startDate, endDate, countryCode, batchId } = filters;
        const skip = (Number(page) - 1) * Number(pageSize);
        const take = Number(pageSize);

        const where: Prisma.ProductionOrderWhereInput = {
            deletedAt: null
        };

        if (view === 'completed') {
            where.status = ProductionOrderStatus.SHIPPED;
        } else if (view === 'in-progress') {
            where.status = { not: ProductionOrderStatus.SHIPPED };
        }

        if (keyword) {
            where.OR = [
                { skuName: { contains: keyword, mode: 'insensitive' } },
                { orderCode: { contains: keyword, mode: 'insensitive' } },
                { product: { sku: { contains: keyword, mode: 'insensitive' } } },
                { batch: { batchNumber: { contains: keyword, mode: 'insensitive' } } }
            ];
        }

        if (startDate || endDate) {
            where.orderDate = {};
            if (startDate) where.orderDate.gte = new Date(startDate);
            if (endDate) where.orderDate.lte = new Date(endDate);
        }

        if (countryCode) {
            where.salesRegion = countryCode;
        }

        if (batchId) {
            where.batchId = batchId;
        }

        const [total, orders] = await prisma.$transaction([
            prisma.productionOrder.count({ where }),
            prisma.productionOrder.findMany({
                where,
                skip,
                take,
                orderBy: [{ orderDate: 'desc' }, { createdAt: 'desc' }],
                include: {
                    batch: true,
                    product: { select: { sku: true, name: true } },
                    statusEvents: true,
                },
            })
        ]);

        const allOrdersForSummary = await prisma.productionOrder.findMany({
            where,
            select: {
                quantity: true, totalPrice: true, cartonCount: true, totalCbm: true, billingKg: true, billingCbm: true
            }
        });
        const summary = summarizeOrders(allOrdersForSummary);
        const items = orders.map(mapOrderListItem);

        return {
            data: items,
            total,
            page: Number(page),
            pageSize: Number(take),
            summary
        };
    }

    async exportOrders(filters: any) {
        const { view, keyword, startDate, endDate, countryCode } = filters;
        const where: Prisma.ProductionOrderWhereInput = { deletedAt: null };

        if (view === 'completed') where.status = ProductionOrderStatus.SHIPPED;
        else if (view === 'in-progress') where.status = { not: ProductionOrderStatus.SHIPPED };

        if (keyword) {
            where.OR = [
                { skuName: { contains: keyword, mode: 'insensitive' } },
                { orderCode: { contains: keyword, mode: 'insensitive' } },
                { product: { sku: { contains: keyword, mode: 'insensitive' } } },
            ];
        }
        if (startDate || endDate) {
            where.orderDate = {};
            if (startDate) where.orderDate.gte = new Date(startDate);
            if (endDate) where.orderDate.lte = new Date(endDate);
        }
        if (countryCode) where.salesRegion = countryCode;

        const orders = await prisma.productionOrder.findMany({
            where,
            orderBy: { orderDate: 'desc' },
            include: {
                batch: true,
                product: { select: { sku: true } }
            }
        });

        const data = orders.map(o => ({
            '批次号': o.batch?.batchNumber,
            '订单编号': o.orderCode,
            '下单日期': o.orderDate ? o.orderDate.toISOString().split('T')[0] : '',
            '状态': STATUS_LABELS[o.status] || o.status,
            '销售地': o.salesRegion,
            'SKU': o.product?.sku,
            '产品名称': o.skuName,
            '颜色': o.productColor,
            '数量': o.quantity,
            '单价': o.unitPrice,
            '总价': o.totalPrice,
            '物流商': o.logisticsProvider,
            '箱数': o.cartonCount,
            '体积(CBM)': o.totalCbm,
            '重量(KG)': o.totalKg,
            '物流费': o.logisticsFee,
            '预计出库': o.outboundDate ? o.outboundDate.toISOString().split('T')[0] : '',
            '入仓日期': o.warehouseDate ? o.warehouseDate.toISOString().split('T')[0] : '',
            '备注': o.notes
        }));

        const ws = xlsx.utils.json_to_sheet(data);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, '物流订单');
        return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }

    async getOrderDetail(id: string) {
        const order = await prisma.productionOrder.findUnique({
            where: { id },
            include: {
                batch: true,
                product: { select: { sku: true, name: true } },
                statusEvents: {
                    include: { createdBy: { select: { nickname: true } } }
                },
            },
        });
        if (!order) return null;
        return {
            ...order,
            statusEvents: sortStatusEvents(order.statusEvents),
            batchCode: `${order.batch.countryCode}${pad(order.batch.batchSequence)}`,
        };
    }

    async createBatch(payload: any, adminId: string) {
        return await prisma.$transaction(async (tx) => {
            const countryCode = payload.countryCode.toUpperCase();
            const productIds = [...new Set(payload.orders.map((o: any) => o.productId)) as any];
            const productMap = await buildProductSnapshotMap(tx, productIds);

            if (productMap.size !== productIds.length) {
                const missing = productIds.filter((id: any) => !productMap.has(id));
                const err: any = new Error(`产品不存在: ${missing.join(',')}`);
                err.code = 'PRODUCT_NOT_FOUND';
                throw err;
            }

            const lastBatch = await tx.productionBatch.findFirst({
                where: { countryCode },
                orderBy: { batchSequence: 'desc' },
                select: { batchSequence: true },
            });
            const batchSequence = (lastBatch?.batchSequence || 0) + 1;
            const batchNumber = pad(batchSequence);

            const batch = await tx.productionBatch.create({
                data: {
                    countryCode,
                    batchSequence,
                    batchNumber,
                    notes: payload.notes || null,
                },
            });

            const createdOrders = [];
            for (let idx = 0; idx < payload.orders.length; idx += 1) {
                const input = payload.orders[idx];
                const product = productMap.get(input.productId);
                const orderSequence = idx + 1;
                const orderCode = `${countryCode}${batchNumber}${pad(orderSequence)}`;
                const totalPrice = calcTotalPrice(input.quantity, input.unitPrice);
                const logisticsFee = calcLogisticsFee(input);

                const order = await tx.productionOrder.create({
                    data: {
                        orderCode,
                        orderSequence,
                        orderDate: input.orderDate,
                        status: ProductionOrderStatus.PENDING,
                        productId: input.productId,
                        skuName: product?.sku || input.skuName,
                        productColor: input.productColor,
                        productSpec: input.productSpec,
                        salesRegion: input.salesRegion || countryCode,
                        plugSpec: input.plugSpec,
                        quantity: input.quantity,
                        unitPrice: input.unitPrice,
                        totalPrice,
                        outboundDate: input.outboundDate || null,
                        logisticsProvider: input.logisticsProvider || null,
                        logisticsUnitPrice: input.logisticsUnitPrice ?? null,
                        warehousingProvider: input.warehousingProvider || null,
                        cartonCount: input.cartonCount ?? null,
                        totalCbm: input.totalCbm ?? null,
                        totalKg: input.totalKg ?? null,
                        billingCbm: input.billingCbm ?? null,
                        billingKg: input.billingKg ?? null,
                        billingMethod: input.billingMethod || null,
                        logisticsFee: logisticsFee ?? input.logisticsFee ?? null,
                        warehouseDate: input.warehouseDate || null,
                        notes: input.notes || null,
                        batchId: batch.id,
                        statusEvents: {
                            create: {
                                status: ProductionOrderStatus.PENDING,
                                occurredAt: input.orderDate,
                                createdById: adminId,
                            },
                        },
                    },
                    include: {
                        product: { select: { sku: true, name: true } },
                        statusEvents: true,
                        batch: true,
                    },
                });
                createdOrders.push(order);
            }

            return { batch, orders: createdOrders };
        });
    }

    async appendOrders(payload: any, adminId: string) {
        return await prisma.$transaction(async (tx) => {
            const batch = await tx.productionBatch.findUnique({ where: { id: payload.batchId } });
            if (!batch) throw new Error('批次不存在');

            const productIds = [...new Set(payload.orders.map((o: any) => o.productId)) as any];
            const productMap = await buildProductSnapshotMap(tx, productIds);

            const lastOrder = await tx.productionOrder.findFirst({
                where: { batchId: payload.batchId },
                orderBy: { orderSequence: 'desc' },
                select: { orderSequence: true },
            });
            let cursor = lastOrder?.orderSequence || 0;

            const createdOrders = [];
            for (let idx = 0; idx < payload.orders.length; idx += 1) {
                cursor += 1;
                const input = payload.orders[idx];
                const product = productMap.get(input.productId);
                const orderCode = `${batch.countryCode}${batch.batchNumber}${pad(cursor)}`;
                const totalPrice = calcTotalPrice(input.quantity, input.unitPrice);

                const order = await tx.productionOrder.create({
                    data: {
                        orderCode,
                        orderSequence: cursor,
                        orderDate: input.orderDate,
                        status: ProductionOrderStatus.PENDING,
                        productId: input.productId,
                        skuName: product?.sku || input.skuName,
                        productColor: input.productColor,
                        productSpec: input.productSpec,
                        salesRegion: input.salesRegion || batch.countryCode,
                        plugSpec: input.plugSpec,
                        quantity: input.quantity,
                        unitPrice: input.unitPrice,
                        totalPrice,
                        batchId: batch.id,
                        statusEvents: {
                            create: {
                                status: ProductionOrderStatus.PENDING,
                                occurredAt: input.orderDate,
                                createdById: adminId,
                            },
                        },
                    },
                    include: { product: true, batch: true, statusEvents: true }
                });
                createdOrders.push(order);
            }
            return { batch, orders: createdOrders };
        });
    }

    async updateOrderStatus(id: string, payload: any, adminId: string) {
        const order = await prisma.productionOrder.findUnique({
            where: { id },
            include: { statusEvents: true },
        });
        if (!order) throw new AppError('订单不存在', 404);

        const currentIdx = STATUS_FLOW.indexOf(order.status);
        const nextIdx = STATUS_FLOW.indexOf(payload.status);
        if (nextIdx === -1) throw new AppError('不支持的状态', 400);
        if (nextIdx < currentIdx) throw new AppError('状态不可回退', 400);

        const dataToUpdate: any = { status: payload.status };
        if (payload.status === ProductionOrderStatus.SHIPPED) {
            dataToUpdate.warehouseDate = payload.occurredAt;
        }

        await prisma.productionOrderStatusEvent.upsert({
            where: {
                orderId_status: {
                    orderId: order.id,
                    status: payload.status,
                },
            },
            update: {
                occurredAt: payload.occurredAt,
                createdById: adminId
            },
            create: {
                orderId: order.id,
                status: payload.status,
                occurredAt: payload.occurredAt,
                createdById: adminId
            },
        });

        await prisma.productionOrder.update({
            where: { id: order.id },
            data: dataToUpdate,
        });

        return await this.getOrderDetail(order.id);
    }

    async batchUpdateOrderStatus(payload: any, adminId: string) {
        const { orderIds, status, occurredAt } = payload;

        const orders = await prisma.productionOrder.findMany({
            where: { id: { in: orderIds }, deletedAt: null },
            select: { id: true, status: true }
        });

        if (orders.length === 0) throw new AppError('未找到有效订单', 404);

        const targetIdx = STATUS_FLOW.indexOf(status);
        if (targetIdx === -1) throw new AppError('目标状态无效', 400);

        const validOrderIds = orders
            .filter(o => STATUS_FLOW.indexOf(o.status) <= targetIdx)
            .map(o => o.id);

        if (validOrderIds.length === 0) throw new AppError('所选订单的状态均高于目标状态，无法更新', 400);

        await prisma.$transaction(async (tx) => {
            const updateData: any = { status };
            if (status === ProductionOrderStatus.SHIPPED) {
                updateData.warehouseDate = occurredAt;
            }
            await tx.productionOrder.updateMany({
                where: { id: { in: validOrderIds } },
                data: updateData
            });

            for (const oid of validOrderIds) {
                await tx.productionOrderStatusEvent.upsert({
                    where: { orderId_status: { orderId: oid, status } },
                    update: { occurredAt, createdById: adminId },
                    create: { orderId: oid, status, occurredAt, createdById: adminId }
                });
            }
        });

        return { message: `成功更新 ${validOrderIds.length} 条订单状态` };
    }

    async updateOrder(id: string, payload: any) {
        const order = await prisma.productionOrder.findUnique({ where: { id } });
        if (!order) throw new AppError('订单不存在', 404);

        const isShipped = order.status === ProductionOrderStatus.SHIPPED;
        const isSensitiveChange =
            payload.quantity !== undefined ||
            payload.unitPrice !== undefined ||
            payload.totalPrice !== undefined ||
            payload.logisticsFee !== undefined;

        if (isShipped && isSensitiveChange) {
            throw new AppError('订单已出库，禁止修改数量、单价或物流费用。', 403);
        }

        const updates = { ...payload };
        const quantity = payload.quantity ?? order.quantity;
        const unitPrice = payload.unitPrice ?? order.unitPrice;
        if (payload.quantity !== undefined || payload.unitPrice !== undefined || payload.totalPrice !== undefined) {
            updates.totalPrice = payload.totalPrice ?? calcTotalPrice(quantity, unitPrice);
            updates.quantity = quantity;
            updates.unitPrice = unitPrice;
        }

        updates.logisticsFee = calcLogisticsFee({
            ...order,
            ...payload,
            billingMethod: payload.billingMethod ?? order.billingMethod,
        }) ?? payload.logisticsFee ?? order.logisticsFee ?? null;

        await prisma.productionOrder.update({
            where: { id: order.id },
            data: updates,
        });

        return await this.getOrderDetail(order.id);
    }

    async deleteOrder(id: string) {
        await prisma.productionOrder.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }

    async deleteBatch(id: string) {
        const now = new Date();
        await prisma.$transaction([
            prisma.productionBatch.update({
                where: { id },
                data: { deletedAt: now }
            }),
            prisma.productionOrder.updateMany({
                where: { batchId: id },
                data: { deletedAt: now }
            })
        ]);
    }
}

export default new LogisticsService();
