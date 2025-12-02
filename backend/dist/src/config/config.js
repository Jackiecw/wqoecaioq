"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env from backend root and project root
[
    path_1.default.resolve(__dirname, '..', '..', '.env'), // backend/../.env
    path_1.default.resolve(__dirname, '..', '..', '..', '.env'), // backend/../../.env (project root)
].forEach(envPath => {
    dotenv_1.default.config({ path: envPath });
});
const configSchema = zod_1.z.object({
    PORT: zod_1.z
        .string()
        .optional()
        .transform((val) => Number(val || 3000))
        .refine((val) => Number.isInteger(val) && val > 0 && val < 65536, 'PORT must be an integer between 1-65535'),
    HOST: zod_1.z.string().optional().default('0.0.0.0'),
    JWT_SECRET: zod_1.z.string().min(10, 'JWT_SECRET is required and must be at least 10 chars'),
    DATABASE_URL: zod_1.z.string().url('DATABASE_URL is invalid'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
});
const parsed = configSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid configuration:', parsed.error.format());
    process.exit(1);
}
exports.config = parsed.data;
exports.default = exports.config;
//# sourceMappingURL=config.js.map