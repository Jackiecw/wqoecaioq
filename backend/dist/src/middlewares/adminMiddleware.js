"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authMiddleware_1 = require("./authMiddleware");
const adminMiddleware = (req, res, next) => {
    (0, authMiddleware_1.authMiddleware)(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        }
        else {
            return res.status(403).json({
                error: 'Access denied: Admin permissions required'
            });
        }
    });
};
exports.default = adminMiddleware;
//# sourceMappingURL=adminMiddleware.js.map