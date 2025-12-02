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
            return res.status(403).json({ error: 'Authentication failed: Invalid or expired token' });
        }
        (req as any).user = user;
        next();
    });
};
