const request = require('supertest');
const app = require('../../index');
console.log('App:', app);
const { describe, it, expect } = require('vitest');

describe('Health Check', () => {
    it('should return 200 OK', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'success', message: 'Backend API is running' });
    });
});
