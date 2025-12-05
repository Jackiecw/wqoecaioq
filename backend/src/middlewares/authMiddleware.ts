import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'Authentication failed: No token provided' });
    }

    jwt.verify(token, config.JWT_SECRET, (err: any, user: any) => {
        if (err) {
            // 使用 401 以便前端自动退出并重新登录（403 会导致死循环请求）
            return res.status(401).json({ error: 'Authentication failed: Invalid or expired token' });
        }
        (req as any).user = user;
        next();
    });
};
