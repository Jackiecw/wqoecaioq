import request from 'supertest';
import app from '../../index';
import { prisma } from '../setup';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Auth Integration', () => {
    const testUser = {
        username: 'testuser_auth',
        password: 'password123',
        nickname: 'Test User',
    };

    beforeAll(async () => {
        // Cleanup
        await prisma.user.deleteMany({ where: { username: testUser.username } });

        // Ensure role exists
        const role = await prisma.role.findUnique({ where: { name: 'operation' } });
        if (!role) {
            await prisma.role.create({
                data: {
                    name: 'operation',
                    description: '负责日常运营工作'
                }
            });
        }
    });

    afterAll(async () => {
        // Cleanup
        await prisma.user.deleteMany({ where: { username: testUser.username } });
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/register')
            .send(testUser);

        if (res.status !== 201) {
            console.log('Register Error:', res.body);
        }

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
