import { Request, Response, NextFunction } from 'express';
import profileService from '../services/profileService';
import { z } from 'zod';
import AppError from '../utils/AppError';
import fs from 'fs';

// --- Zod Schemas ---
const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, "必须提供旧密码"),
    newPassword: z.string().min(8, "新密码至少需要8个字符"),
});

const updateProfileSchema = z.object({
    nickname: z.string().min(1, "昵称不能为空"),
});

export class ProfileController {
    async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = (req as any).user;
            const validation = changePasswordSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const result = await profileService.changePassword(userId, validation.data);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = (req as any).user;
            const validation = updateProfileSchema.safeParse(req.body);

            if (!validation.success) {
                if (req.file) fs.unlinkSync(req.file.path);
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }

            const result = await profileService.updateProfile(userId, validation.data, req.file);
            res.json(result);
        } catch (error) {
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (err) {
                    console.error('Failed to delete uploaded file on error:', err);
                }
            }
            next(error);
        }
    }
}

export default new ProfileController();
