import prisma from '../../prismaClient';
import bcrypt from 'bcryptjs';
import AppError from '../utils/AppError';
import { Prisma } from '@prisma/client';

export class AdminService {
    // --- Users ---
    async getAllUsers() {
        const users = await prisma.user.findMany({
            include: {
                role: true,
                supervisedCountries: true,
                operatedCountries: true,
            },
            orderBy: { createdAt: 'asc' },
        });
        return users.map(user => {
            const { passwordHash, ...userSafe } = user;
            return userSafe;
        });
    }

    async getUserById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                role: true,
                supervisedCountries: { select: { id: true, code: true } },
                operatedCountries: { select: { id: true, code: true } },
            }
        });
        if (!user) throw new AppError('用户未找到', 404);
        const { passwordHash, ...userSafe } = user;
        return userSafe;
    }

    async createUser(data: any) {
        const { username, password, nickname, roleId, supervisedCountryIds, operatedCountryIds } = data;

        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) throw new AppError('此用户名已被占用', 400);

        const roleExists = await prisma.role.findUnique({ where: { id: roleId } });
        if (!roleExists) throw new AppError('所选角色无效', 400);

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                passwordHash: hashedPassword,
                nickname,
                role: { connect: { id: roleId } },
                supervisedCountries: {
                    connect: supervisedCountryIds?.map((id: string) => ({ id })) || []
                },
                operatedCountries: {
                    connect: operatedCountryIds?.map((id: string) => ({ id })) || []
                }
            },
            include: {
                role: true,
                supervisedCountries: true,
                operatedCountries: true
            }
        });

        const { passwordHash, ...userSafe } = newUser;
        return userSafe;
    }

    async updateUser(id: string, data: any) {
        const { nickname, roleId, supervisedCountryIds, operatedCountryIds } = data;

        const roleExists = await prisma.role.findUnique({ where: { id: roleId } });
        if (!roleExists) throw new AppError('所选角色无效', 400);

        try {
            const updatedUser = await prisma.user.update({
                where: { id },
                data: {
                    nickname,
                    roleId,
                    supervisedCountries: {
                        set: supervisedCountryIds?.map((id: string) => ({ id })) || []
                    },
                    operatedCountries: {
                        set: operatedCountryIds?.map((id: string) => ({ id })) || []
                    }
                },
                include: {
                    role: true,
                    supervisedCountries: true,
                    operatedCountries: true
                }
            });
            const { passwordHash, ...userSafe } = updatedUser;
            return userSafe;
        } catch (error: any) {
            if (error.code === 'P2025') throw new AppError('用户未找到', 404);
            throw error;
        }
    }

    async resetPassword(id: string) {
        const userToReset = await prisma.user.findUnique({ where: { id }, select: { username: true } });
        if (!userToReset) throw new AppError('用户未找到', 404);
        if (userToReset.username === 'admin') throw new AppError('禁止重置超级管理员的密码', 403);

        const defaultPassword = 'q1234567';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        await prisma.user.update({
            where: { id },
            data: { passwordHash: hashedPassword },
        });

        return { message: `用户 ${userToReset.username} 的密码已重置为 'q1234567'` };
    }

    async deleteUser(id: string, currentUserId: string) {
        if (id === currentUserId) throw new AppError('无法删除当前登录账号', 400);

        const targetUser = await prisma.user.findUnique({ where: { id }, select: { id: true, username: true } });
        if (!targetUser) throw new AppError('用户未找到', 404);
        if (targetUser.username === 'admin') throw new AppError('无法删除内置超级管理员账号', 400);

        try {
            await prisma.user.delete({ where: { id } });
        } catch (error: any) {
            if (error.code === 'P2003' || error.code === 'P2014') {
                throw new AppError('无法删除该用户：存在关联数据，请先清理相关记录', 400);
            }
            throw error;
        }
    }

    // --- Roles ---
    async getAllRoles() {
        return await prisma.role.findMany({ orderBy: { name: 'asc' } });
    }

    async getRoleById(id: string) {
        const role = await prisma.role.findUnique({
            where: { id },
            include: { menus: true },
        });
        if (!role) throw new AppError('角色未找到', 404);
        return role;
    }

    async createRole(data: any) {
        const { name, description, menuIds } = data;
        const existingRole = await prisma.role.findUnique({ where: { name } });
        if (existingRole) throw new AppError('此角色名 (key) 已被占用', 400);

        return await prisma.role.create({
            data: {
                name,
                description,
                menus: {
                    connect: menuIds.map((id: string) => ({ id })),
                },
            },
            include: { menus: true }
        });
    }

    async updateRole(id: string, data: any) {
        const { name, description, menuIds } = data;
        const existingRole = await prisma.role.findUnique({ where: { name } });
        if (existingRole && existingRole.id !== id) throw new AppError('此角色名 (key) 已被其他角色占用', 400);

        try {
            return await prisma.role.update({
                where: { id },
                data: {
                    name,
                    description,
                    menus: {
                        set: menuIds.map((id: string) => ({ id })),
                    },
                },
                include: { menus: true }
            });
        } catch (error: any) {
            if (error.code === 'P2025') throw new AppError('角色未找到', 404);
            throw error;
        }
    }

    // --- Menu Items ---
    async getAllMenuItems() {
        return await prisma.menuItem.findMany({ orderBy: { key: 'asc' } });
    }

    // --- Common Links ---
    async createLink(data: any) {
        return await prisma.commonLink.create({ data });
    }

    async updateLink(id: string, data: any) {
        try {
            return await prisma.commonLink.update({ where: { id }, data });
        } catch (error: any) {
            if (error.code === 'P2025') throw new AppError('链接未找到', 404);
            throw error;
        }
    }

    async deleteLink(id: string) {
        try {
            await prisma.commonLink.delete({ where: { id } });
        } catch (error: any) {
            if (error.code === 'P2025') throw new AppError('链接未找到', 404);
            throw error;
        }
    }

    // --- Calendar ---
    async getCalendarEvents(start: string, end: string, userId?: string) {
        const where: Prisma.CalendarEventWhereInput = {
            startAt: { lte: new Date(end) },
            endAt: { gte: new Date(start) }
        };

        if (userId) {
            where.authorId = userId;
        } else {
            where.createdByAdmin = true;
        }

        return await prisma.calendarEvent.findMany({
            where,
            orderBy: { startAt: 'asc' },
            include: {
                author: { select: { nickname: true, id: true } }
            }
        });
    }

    async createCalendarEvent(data: any, adminId: string) {
        const { userId, ...eventData } = data;
        try {
            return await prisma.calendarEvent.create({
                data: {
                    ...eventData,
                    authorId: userId,
                    createdByAdmin: true,
                    adminCreatorId: adminId
                }
            });
        } catch (error: any) {
            if (error.code === 'P2003') throw new AppError('指派的用户 (userId) 未找到', 404);
            throw error;
        }
    }

    async updateCalendarEvent(id: string, data: any) {
        const { userId, ...eventData } = data;
        const payload: any = { ...eventData };
        if (userId) payload.authorId = userId;

        try {
            return await prisma.calendarEvent.update({
                where: { id },
                data: payload
            });
        } catch (error: any) {
            if (error.code === 'P2025') throw new AppError('事件未找到', 404);
            if (error.code === 'P2003') throw new AppError('指派的用户 (userId) 未找到', 404);
            throw error;
        }
    }

    async deleteCalendarEvent(id: string) {
        try {
            await prisma.calendarEvent.delete({ where: { id } });
        } catch (error: any) {
            if (error.code === 'P2025') throw new AppError('事件未找到', 404);
            throw error;
        }
    }
}

export default new AdminService();
