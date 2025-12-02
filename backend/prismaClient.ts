import { PrismaClient } from '@prisma/client';

declare global {
    var __PRISMA_CLIENT__: PrismaClient | undefined;
}

const prismaSingleton = () => {
    if (!global.__PRISMA_CLIENT__) {
        global.__PRISMA_CLIENT__ = new PrismaClient();
    }
    return global.__PRISMA_CLIENT__;
};

const prisma = prismaSingleton();

export default prisma;
export const getPrismaClient = prismaSingleton;
