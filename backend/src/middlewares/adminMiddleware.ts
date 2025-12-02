import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './authMiddleware';

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    authMiddleware(req, res, () => {
        if ((req as any).user && (req as any).user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({
                error: 'Access denied: Admin permissions required'
            });
        }
    });
};

export default adminMiddleware;
