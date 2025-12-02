"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_ATTEMPTS = exports.WINDOW_MS = exports.reset = void 0;
const logger_1 = __importDefault(require("./src/utils/logger"));
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS_PER_WINDOW = 5;
const attemptStore = new Map();
const loginRateLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    let attempts = attemptStore.get(ip) || [];
    // Filter out old attempts
    attempts = attempts.filter(timestamp => now - timestamp < ATTEMPT_WINDOW_MS);
    if (attempts.length >= MAX_ATTEMPTS_PER_WINDOW) {
        const windowMinutes = ATTEMPT_WINDOW_MS / 60000;
        logger_1.default.warn(`登录尝试过多：${ip} 在 ${windowMinutes} 分钟内尝试次数超过限制`, { ip });
        return res.status(429).json({ error: '登录尝试次数过多，请稍后再试' });
    }
    attempts.push(now);
    attemptStore.set(ip, attempts);
    next();
};
// Assign properties to the function object if needed, or export constants separately.
// For compatibility with CommonJS style `loginRateLimiter.reset = ...`, we can attach them.
// But in TS, it's better to export them.
// However, to match the previous usage, we can export a namespace or just export properties.
// Let's export default function and named exports.
const reset = () => attemptStore.clear();
exports.reset = reset;
exports.WINDOW_MS = ATTEMPT_WINDOW_MS;
exports.MAX_ATTEMPTS = MAX_ATTEMPTS_PER_WINDOW;
exports.default = loginRateLimiter;
//# sourceMappingURL=loginRateLimiter.js.map