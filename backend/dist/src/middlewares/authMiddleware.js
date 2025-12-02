"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config/config"));
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.status(401).json({ error: 'Authentication failed: No token provided' });
    }
    jsonwebtoken_1.default.verify(token, config_1.default.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Authentication failed: Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=authMiddleware.js.map