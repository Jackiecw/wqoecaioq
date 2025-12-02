import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { z } from 'zod';

const registerSchema = z.object({
    username: z.string().min(3, "用户名至少需要3个字符"),
    password: z.string().min(8, "密码至少需要8个字符"),
    nickname: z.string().min(1, "昵称不能为空"),
});

const loginSchema = z.object({
    username: z.string().min(1, "用户名不能为空"),
    password: z.string().min(1, "密码不能为空")
});

class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = registerSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: '输入数据无效',
                    details: validation.error.errors,
                });
            }

            const user = await authService.register(validation.data);
            res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = loginSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: '输入数据无效',
                    details: validation.error.errors,
                });
            }

            const result = await authService.login(validation.data);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController();
