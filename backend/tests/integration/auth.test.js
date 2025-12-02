const request = require('supertest');
const app = require('../../index');
const { prisma } = require('../setup');
// const { describe, it, expect, beforeAll, afterAll } = require('vitest'); // Globals provided by runner

describe('Auth Integration', () => {
    const testUser = {
        username: 'testuser_auth',
        password: 'password123',
        nickname: 'Test User',
    };

    beforeAll(async () => {
        // Cleanup
        await prisma.user.deleteMany({ where: { username: testUser.username } });
    });

    afterAll(async () => {
        // Cleanup
        await prisma.user.deleteMany({ where: { username: testUser.username } });
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/register')
            .send(testUser);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.username).toBe(testUser.username);
        expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('should login with valid credentials', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({
                username: testUser.username,
                password: testUser.password,
            });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.message).toBe('登录成功!');
    });

    it('should fail login with invalid password', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({
                username: testUser.username,
                password: 'wrongpassword',
            });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('认证失败：密码错误'); // AppError message
    });
});
