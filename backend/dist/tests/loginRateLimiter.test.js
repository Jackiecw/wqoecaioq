"use strict";
// ./backend/tests/loginRateLimiter.test.js
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const loginRateLimiter_1 = __importStar(require("../loginRateLimiter"));
const createReq = () => ({
    ip: '127.0.0.1',
    headers: { 'user-agent': 'vitest' },
    connection: { remoteAddress: '127.0.0.1' },
});
const createRes = () => {
    const res = {};
    res.status = vitest_1.vi.fn().mockReturnValue(res);
    res.json = vitest_1.vi.fn().mockReturnValue(res);
    return res;
};
(0, vitest_1.describe)('loginRateLimiter', () => {
    (0, vitest_1.beforeEach)(() => {
        (0, loginRateLimiter_1.reset)();
        vitest_1.vi.useFakeTimers();
        vitest_1.vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('allows attempts within the rate limit window', () => {
        const next = vitest_1.vi.fn();
        const req = createReq();
        const res = createRes();
        for (let i = 0; i < loginRateLimiter_1.MAX_ATTEMPTS; i += 1) {
            (0, loginRateLimiter_1.default)(req, res, next);
        }
        (0, vitest_1.expect)(next).toHaveBeenCalledTimes(loginRateLimiter_1.MAX_ATTEMPTS);
        (0, vitest_1.expect)(res.status).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('blocks requests after exceeding the limit', () => {
        const next = vitest_1.vi.fn();
        const req = createReq();
        const res = createRes();
        for (let i = 0; i < loginRateLimiter_1.MAX_ATTEMPTS; i += 1) {
            (0, loginRateLimiter_1.default)(req, res, next);
        }
        (0, loginRateLimiter_1.default)(req, res, next);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(429);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ error: '登录尝试次数过多，请稍后再试' }));
    });
    (0, vitest_1.it)('allows attempts again after the window expires', () => {
        const next = vitest_1.vi.fn();
        const req = createReq();
        const res = createRes();
        for (let i = 0; i < loginRateLimiter_1.MAX_ATTEMPTS; i += 1) {
            (0, loginRateLimiter_1.default)(req, res, next);
        }
        (0, loginRateLimiter_1.default)(req, res, next);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(429);
        vitest_1.vi.advanceTimersByTime(loginRateLimiter_1.WINDOW_MS + 1000);
        res.status.mockClear();
        res.json.mockClear();
        next.mockClear();
        (0, loginRateLimiter_1.default)(req, res, next);
        (0, vitest_1.expect)(next).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(res.status).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=loginRateLimiter.test.js.map