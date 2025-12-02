import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../prismaClient';
import config from '../config/config';
import AppError from '../utils/AppError';

class AuthService {
    async register(data: any) {
        const { username, password, nickname } = data;

        const operationRole = await prisma.role.findUnique({
            where: { name: 'operation' },
        });

        if (!operationRole) {
            throw new AppError('服务器配置错误：无法分配角色', 500);
        }

        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            throw new AppError('此用户名已被占用', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                passwordHash: hashedPassword,
                nickname,
                role: {
                    connect: { id: operationRole.id },
                },
            },
        });

        const { passwordHash, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }

    async login(data: any) {
        const { username, password } = data;

        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                role: {
                    include: {
                        menus: true,
                    },
                },
                operatedCountries: {
                    select: { code: true },
                },
                supervisedCountries: {
                    select: { code: true },
                },
            },
        });

        if (!user) {
            throw new AppError('认证失败：用户不存在', 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new AppError('认证失败：密码错误', 401);
        }

        const permissions = user.role.menus.map((menu) => menu.key);
        const operatedCountries = user.operatedCountries.map((country) => country.code);
        const supervisedCountries = user.supervisedCountries.map((country) => country.code);

        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role.name,
                nickname: user.nickname,
                avatarUrl: user.avatarUrl,
                permissions,
                operatedCountries,
                supervisedCountries,
            },
            config.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            message: '登录成功!',
            token,
        };
    }
}

export default new AuthService();
