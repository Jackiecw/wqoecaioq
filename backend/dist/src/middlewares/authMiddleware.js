"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config/config"));
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.status(401).json({ error: 'Authentication failed: No token provided' });
    }
    jsonwebtoken_1.default.verify(token, config_1.default.JWT_SECRET, async (err, user) => {
        if (err) {
            // 使用 401 以便前端自动退出并重新登录（403 会导致死循环请求）
            return res.status(401).json({ error: 'Authentication failed: Invalid or expired token' });
        }
        try {
            // Verify that the user still exists in the database
            const dbUser = await prismaClient_1.default.user.findUnique({
                where: { id: user.userId },
                select: { id: true }
            });
            if (!dbUser) {
                return res.status(401).json({ error: 'Authentication failed: User no longer exists' });
            }
            req.user = user;
            next();
        }
        catch (dbErr) {
            console.error('Error verifying user existence authMiddleware:', dbErr);
            return res.status(500).json({ error: 'Internal server error during authentication' });
        }
    });
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=authMiddleware.js.map