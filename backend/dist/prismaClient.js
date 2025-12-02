"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrismaClient = void 0;
const client_1 = require("@prisma/client");
const prismaSingleton = () => {
    if (!global.__PRISMA_CLIENT__) {
        global.__PRISMA_CLIENT__ = new client_1.PrismaClient();
    }
    return global.__PRISMA_CLIENT__;
};
const prisma = prismaSingleton();
exports.default = prisma;
exports.getPrismaClient = prismaSingleton;
//# sourceMappingURL=prismaClient.js.map