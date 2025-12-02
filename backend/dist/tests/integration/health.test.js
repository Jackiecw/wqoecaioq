"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../../index"));
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Health Check', () => {
    (0, vitest_1.it)('should return 200 OK', async () => {
        const res = await (0, supertest_1.default)(index_1.default).get('/');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body).toEqual({ status: 'success', message: 'Backend API is running' });
    });
});
//# sourceMappingURL=health.test.js.map