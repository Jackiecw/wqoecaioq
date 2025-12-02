import prisma from '../../prismaClient';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import config from '../config/config';
import AppError from '../utils/AppError';

const JWT_SECRET = config.JWT_SECRET;

export class ProfileService {
    async changePassword(userId: string, data: any) {
        const { oldPassword, newPassword } = data;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true }
        });

        if (!user) throw new AppError('用户未找到', 404);

        const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new AppError('旧密码不正确', 401);
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        });

        return { message: '密码修改成功' };
    }

    async updateProfile(userId: string, data: any, file?: Express.Multer.File) {
        const { nickname } = data;
        const payload: any = { nickname };

        const oldUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true }
        });

        if (file) {
            payload.avatarUrl = `/uploads/avatars/${file.filename}`;

            if (oldUser && oldUser.avatarUrl) {
                const oldPath = path.join(__dirname, '../../', oldUser.avatarUrl);
                if (fs.existsSync(oldPath)) {
                    try {
                        fs.unlinkSync(oldPath);
                    } catch (err) {
                        console.error('Failed to delete old avatar:', err);
                    }
                }
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: payload,
        });

        const userWithRoles = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: { include: { menus: true } },
                operatedCountries: { select: { code: true } },
                supervisedCountries: { select: { code: true } }
            }
        });

        if (!userWithRoles) throw new AppError('用户数据异常', 500);

        const permissions = userWithRoles.role.menus.map(menu => menu.key);
        const operatedCountries = userWithRoles.operatedCountries.map(country => country.code);
        const supervisedCountries = userWithRoles.supervisedCountries.map(country => country.code);

        const newToken = jwt.sign(
            {
                userId: updatedUser.id,
                role: userWithRoles.role.name,
                nickname: updatedUser.nickname,
                avatarUrl: updatedUser.avatarUrl,
                permissions: permissions,
                operatedCountries: operatedCountries,
                supervisedCountries: supervisedCountries
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { passwordHash, ...userSafe } = updatedUser;

        return {
            message: '个人资料更新成功',
            token: newToken,
            user: userSafe
        };
    }
}

export default new ProfileService();
