// const { beforeAll, afterAll, afterEach } = require('vitest'); // Globals provided by runner
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Explicitly load backend/.env for tests
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

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

module.exports = { prisma };
