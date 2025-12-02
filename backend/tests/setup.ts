import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { beforeAll, afterAll, afterEach } from 'vitest';

// Explicitly load backend/.env for tests
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const prisma = new PrismaClient();

beforeAll(async () => {
    // Connect to database
    await prisma.$connect();
});

afterAll(async () => {
    // Disconnect from database
    await prisma.$disconnect();
});

afterEach(async () => {
    // Optional: Clean up database after each test if needed
    // await prisma.user.deleteMany();
});
