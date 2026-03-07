import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './authMiddleware';

/**
 * 通用权限检查中间件
 *
 * 先通过 authMiddleware 验证 JWT，再检查用户是否拥有所有指定权限。
 * admin 角色自动通过所有权限检查。
 *
 * 使用示例:
 *   router.get('/sales', requirePermission('SALES:VIEW'), handler);
 *   router.post('/sales/import', requirePermission('SALES:IMPORT'), handler);
 *
 * 注意：requirePermission 内部已包含 authMiddleware，不需要同时使用两者。
 */
export function requirePermission(...requiredPermissions: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        authMiddleware(req, res, () => {
            const user = (req as any).user;

            // admin 角色自动拥有所有权限
            if (user.role === 'admin') return next();

            const userPerms: string[] = user.permissions || [];
            const missing = requiredPermissions.filter((p) => !userPerms.includes(p));

            if (missing.length > 0) {
                return res.status(403).json({
                    error: `权限不足，需要: ${missing.join(', ')}`,
                });
            }
            next();
        });
    };
}
