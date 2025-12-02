"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../../index"));
const setup_1 = require("../setup");
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Auth Integration', () => {
    const testUser = {
        username: 'testuser_auth',
        password: 'password123',
        nickname: 'Test User',
    };
    (0, vitest_1.beforeAll)(async () => {
        // Cleanup
        await setup_1.prisma.user.deleteMany({ where: { username: testUser.username } });
        // Ensure role exists
        const role = await setup_1.prisma.role.findUnique({ where: { name: 'operation' } });
        if (!role) {
            await setup_1.prisma.role.create({
                data: {
                    name: 'operation',
                    description: '负责日常运营工作'
                }
            });
        }
    });
    (0, vitest_1.afterAll)(async () => {
        // Cleanup
        await setup_1.prisma.user.deleteMany({ where: { username: testUser.username } });
    });
    (0, vitest_1.it)('should register a new user', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/register')
            .send(testUser);
        if (res.status !== 201) {
            console.log('Register Error:', res.body);
        }
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body).toHaveProperty('id');
        (0, vitest_1.expect)(res.body.username).toBe(testUser.username);
        (0, vitest_1.expect)(res.body).not.toHaveProperty('passwordHash');
    });
    (0, vitest_1.it)('should login with valid credentials', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/login')
            .send({
            username: testUser.username,
            password: testUser.password,
        });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body).toHaveProperty('token');
        (0, vitest_1.expect)(res.body.message).toBe('登录成功!');
    });
    (0, vitest_1.it)('should fail login with invalid password', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/login')
            .send({
            username: testUser.username,
            password: 'wrongpassword',
        });
        (0, vitest_1.expect)(res.status).toBe(401);
        (0, vitest_1.expect)(res.body.message).toBe('认证失败：密码错误'); // AppError message
    });
});
//# sourceMappingURL=auth.test.js.map