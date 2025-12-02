import { z } from 'zod';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from backend root and project root
[
    path.resolve(__dirname, '..', '..', '.env'), // backend/../.env
    path.resolve(__dirname, '..', '..', '..', '.env'), // backend/../../.env (project root)
].forEach(envPath => {
    dotenv.config({ path: envPath });
});

const configSchema = z.object({
    PORT: z
        .string()
        .optional()
        .transform((val) => Number(val || 3000))
        .refine((val) => Number.isInteger(val) && val > 0 && val < 65536, 'PORT must be an integer between 1-65535'),
    HOST: z.string().optional().default('0.0.0.0'),
    JWT_SECRET: z.string().min(10, 'JWT_SECRET is required and must be at least 10 chars'),
    DATABASE_URL: z.string().url('DATABASE_URL is invalid'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid configuration:', parsed.error.format());
    process.exit(1);
}

export const config = parsed.data;
export default config;
