"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class AdminService {
    // --- Users ---
    async getAllUsers() {
        const users = await prismaClient_1.default.user.findMany({
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
    async getUserById(id) {
        const user = await prismaClient_1.default.user.findUnique({
            where: { id },
            include: {
                role: true,
                supervisedCountries: { select: { id: true, code: true } },
                operatedCountries: { select: { id: true, code: true } },
            }
        });
        if (!user)
            throw new AppError_1.default('用户未找到', 404);
        const { passwordHash, ...userSafe } = user;
        return userSafe;
    }
    async createUser(data) {
        const { username, password, nickname, roleId, supervisedCountryIds, operatedCountryIds } = data;
        const existingUser = await prismaClient_1.default.user.findUnique({ where: { username } });
        if (existingUser)
            throw new AppError_1.default('此用户名已被占用', 400);
        const roleExists = await prismaClient_1.default.role.findUnique({ where: { id: roleId } });
        if (!roleExists)
            throw new AppError_1.default('所选角色无效', 400);
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = await prismaClient_1.default.user.create({
            data: {
                username,
                passwordHash: hashedPassword,
                nickname,
                role: { connect: { id: roleId } },
                supervisedCountries: {
                    connect: supervisedCountryIds?.map((id) => ({ id })) || []
                },
                operatedCountries: {
                    connect: operatedCountryIds?.map((id) => ({ id })) || []
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
    async updateUser(id, data) {
        const { nickname, roleId, supervisedCountryIds, operatedCountryIds } = data;
        const roleExists = await prismaClient_1.default.role.findUnique({ where: { id: roleId } });
        if (!roleExists)
            throw new AppError_1.default('所选角色无效', 400);
        try {
            const updatedUser = await prismaClient_1.default.user.update({
                where: { id },
                data: {
                    nickname,
                    roleId,
                    supervisedCountries: {
                        set: supervisedCountryIds?.map((id) => ({ id })) || []
                    },
                    operatedCountries: {
                        set: operatedCountryIds?.map((id) => ({ id })) || []
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
        }
        catch (error) {
            if (error.code === 'P2025')
                throw new AppError_1.default('用户未找到', 404);
            throw error;
        }
    }
    async resetPassword(id) {
        const userToReset = await prismaClient_1.default.user.findUnique({ where: { id }, select: { username: true } });
        if (!userToReset)
            throw new AppError_1.default('用户未找到', 404);
        if (userToReset.username === 'admin')
            throw new AppError_1.default('禁止重置超级管理员的密码', 403);
        const defaultPassword = 'q1234567';
        const hashedPassword = await bcryptjs_1.default.hash(defaultPassword, 10);
        await prismaClient_1.default.user.update({
            where: { id },
            data: { passwordHash: hashedPassword },
        });
        return { message: `用户 ${userToReset.username} 的密码已重置为 'q1234567'` };
    }
    async deleteUser(id, currentUserId) {
        if (id === currentUserId)
            throw new AppError_1.default('无法删除当前登录账号', 400);
        const targetUser = await prismaClient_1.default.user.findUnique({ where: { id }, select: { id: true, username: true } });
        if (!targetUser)
            throw new AppError_1.default('用户未找到', 404);
        if (targetUser.username === 'admin')
            throw new AppError_1.default('无法删除内置超级管理员账号', 400);
        try {
            await prismaClient_1.default.user.delete({ where: { id } });
        }
        catch (error) {
            if (error.code === 'P2003' || error.code === 'P2014') {
                throw new AppError_1.default('无法删除该用户：存在关联数据，请先清理相关记录', 400);
            }
            throw error;
        }
    }
    // --- Roles ---
    async getAllRoles() {
        return await prismaClient_1.default.role.findMany({ orderBy: { name: 'asc' } });
    }
    async getRoleById(id) {
        const role = await prismaClient_1.default.role.findUnique({
            where: { id },
            include: { menus: true },
        });
        if (!role)
            throw new AppError_1.default('角色未找到', 404);
        return role;
    }
    async createRole(data) {
        const { name, description, menuIds } = data;
        const existingRole = await prismaClient_1.default.role.findUnique({ where: { name } });
        if (existingRole)
            throw new AppError_1.default('此角色名 (key) 已被占用', 400);
        return await prismaClient_1.default.role.create({
            data: {
                name,
                description,
                menus: {
                    connect: menuIds.map((id) => ({ id })),
                },
            },
            include: { menus: true }
        });
    }
    async updateRole(id, data) {
        const { name, description, menuIds } = data;
        const existingRole = await prismaClient_1.default.role.findUnique({ where: { name } });
        if (existingRole && existingRole.id !== id)
            throw new AppError_1.default('此角色名 (key) 已被其他角色占用', 400);
        try {
            return await prismaClient_1.default.role.update({
                where: { id },
                data: {
                    name,
                    description,
                    menus: {
                        set: menuIds.map((id) => ({ id })),
                    },
                },
                include: { menus: true }
            });
        }
        catch (error) {
            if (error.code === 'P2025')
                throw new AppError_1.default('角色未找到', 404);
            throw error;
        }
    }
    // --- Menu Items ---
    async getAllMenuItems() {
        return await prismaClient_1.default.menuItem.findMany({ orderBy: { key: 'asc' } });
    }
    // --- Common Links ---
    async createLink(data) {
        return await prismaClient_1.default.commonLink.create({ data });
    }
    async updateLink(id, data) {
        try {
            return await prismaClient_1.default.commonLink.update({ where: { id }, data });
        }
        catch (error) {
            if (error.code === 'P2025')
                throw new AppError_1.default('链接未找到', 404);
            throw error;
        }
    }
    async deleteLink(id) {
        try {
            await prismaClient_1.default.commonLink.delete({ where: { id } });
        }
        catch (error) {
            if (error.code === 'P2025')
                throw new AppError_1.default('链接未找到', 404);
            throw error;
        }
    }
    // --- Calendar ---
    async getCalendarEvents(start, end, userId) {
        const where = {
            startAt: { lte: new Date(end) },
            endAt: { gte: new Date(start) }
        };
        if (userId) {
            where.authorId = userId;
        }
        else {
            where.createdByAdmin = true;
        }
        return await prismaClient_1.default.calendarEvent.findMany({
            where,
            orderBy: { startAt: 'asc' },
            include: {
                author: { select: { nickname: true, id: true } }
            }
        });
    }
    async createCalendarEvent(data, adminId) {
        const { userId, ...eventData } = data;
        try {
            return await prismaClient_1.default.calendarEvent.create({
                data: {
                    ...eventData,
                    authorId: userId,
                    createdByAdmin: true,
                    adminCreatorId: adminId
                }
            });
        }
        catch (error) {
            if (error.code === 'P2003')
                throw new AppError_1.default('指派的用户 (userId) 未找到', 404);
            throw error;
        }
    }
    async updateCalendarEvent(id, data) {
        const { userId, ...eventData } = data;
        const payload = { ...eventData };
        if (userId)
            payload.authorId = userId;
        try {
            return await prismaClient_1.default.calendarEvent.update({
                where: { id },
                data: payload
            });
        }
        catch (error) {
            if (error.code === 'P2025')
                throw new AppError_1.default('事件未找到', 404);
            if (error.code === 'P2003')
                throw new AppError_1.default('指派的用户 (userId) 未找到', 404);
            throw error;
        }
    }
    async deleteCalendarEvent(id) {
        try {
            await prismaClient_1.default.calendarEvent.delete({ where: { id } });
        }
        catch (error) {
            if (error.code === 'P2025')
                throw new AppError_1.default('事件未找到', 404);
            throw error;
        }
    }
}
exports.AdminService = AdminService;
exports.default = new AdminService();
//# sourceMappingURL=adminService.js.map