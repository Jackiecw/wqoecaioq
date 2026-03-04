import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import prisma from '../../prismaClient';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'Authentication failed: No token provided' });
    }

    jwt.verify(token, config.JWT_SECRET, async (err: any, user: any) => {
        if (err) {
            // 使用 401 以便前端自动退出并重新登录（403 会导致死循环请求）
            return res.status(401).json({ error: 'Authentication failed: Invalid or expired token' });
        }

        try {
            // Verify that the user still exists in the database
            const dbUser = await prisma.user.findUnique({
                where: { id: user.userId },
                select: { id: true }
            });

            if (!dbUser) {
                return res.status(401).json({ error: 'Authentication failed: User no longer exists' });
            }

            (req as any).user = user;
            next();
        } catch (dbErr) {
            console.error('Error verifying user existence authMiddleware:', dbErr);
            return res.status(500).json({ error: 'Internal server error during authentication' });
        }
    });
};
