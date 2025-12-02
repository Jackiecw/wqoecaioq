import { Request, Response, NextFunction } from 'express';
import adminService from '../services/adminService';
import { z } from 'zod';
import AppError from '../utils/AppError';

// --- Zod Schemas ---
const userCreateSchema = z.object({
    username: z.string().min(3, "用户名至少需要3个字符"),
    password: z.string().min(8, "密码至少需要8个字符"),
    nickname: z.string().min(1, "昵称不能为空"),
    roleId: z.string().min(1, "必须选择一个角色"),
    supervisedCountryIds: z.array(z.string()).optional(),
    operatedCountryIds: z.array(z.string()).optional(),
});

const userUpdateSchema = z.object({
    nickname: z.string().min(1, "昵称不能为空"),
    roleId: z.string().min(1, "必须选择一个角色"),
    supervisedCountryIds: z.array(z.string()).optional(),
    operatedCountryIds: z.array(z.string()).optional(),
});

const roleSchema = z.object({
    name: z.string().min(2, "角色名 (key) 至少需要2个字符"),
    description: z.string().min(1, "角色描述不能为空"),
    menuIds: z.array(z.string()).default([]),
});

const linkSchema = z.object({
    title: z.string().min(1, "标题不能为空"),
    url: z.string().url("必须是有效的 URL (例如: https://...)"),
    description: z.string().optional().nullable(),
    displayOrder: z.coerce.number().int().default(0),
});

const adminCalendarEventSchema = z.object({
    title: z.string().min(1, "标题不能为空"),
    startAt: z.string().datetime("开始时间无效"),
    endAt: z.string().datetime("结束时间无效"),
    isAllDay: z.boolean().default(false),
    color: z.string().default('blue'),
    userId: z.string().min(1, "必须指定一个用户"),
});

const adminCalendarEventUpdateSchema = z.object({
    title: z.string().min(1, "标题不能为空").optional(),
    startAt: z.string().datetime("开始时间无效").optional(),
    endAt: z.string().datetime("结束时间无效").optional(),
    isAllDay: z.boolean().optional(),
    color: z.string().optional(),
    userId: z.string().min(1, "必须指定一个用户").optional(),
});

export class AdminController {
    // --- Users ---
    async getAllUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await adminService.getAllUsers();
            res.json(users);
        } catch (error) {
            next(error);
        }
    }

    async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await adminService.getUserById(req.params.id);
            res.json(user);
        } catch (error) {
            next(error);
        }
    }

    async createUser(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = userCreateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newUser = await adminService.createUser(validation.data);
            res.status(201).json(newUser);
        } catch (error) {
            next(error);
        }
    }

    async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = userUpdateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedUser = await adminService.updateUser(req.params.id, validation.data);
            res.json(updatedUser);
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await adminService.resetPassword(req.params.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = (req as any).user;
            await adminService.deleteUser(req.params.id, userId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // --- Roles ---
    async getAllRoles(req: Request, res: Response, next: NextFunction) {
        try {
            const roles = await adminService.getAllRoles();
            res.json(roles);
        } catch (error) {
            next(error);
        }
    }

    async getRoleById(req: Request, res: Response, next: NextFunction) {
        try {
            const role = await adminService.getRoleById(req.params.id);
            res.json(role);
        } catch (error) {
            next(error);
        }
    }

    async createRole(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = roleSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newRole = await adminService.createRole(validation.data);
            res.status(201).json(newRole);
        } catch (error) {
            next(error);
        }
    }

    async updateRole(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = roleSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedRole = await adminService.updateRole(req.params.id, validation.data);
            res.json(updatedRole);
        } catch (error) {
            next(error);
        }
    }

    // --- Menu Items ---
    async getAllMenuItems(req: Request, res: Response, next: NextFunction) {
        try {
            const items = await adminService.getAllMenuItems();
            res.json(items);
        } catch (error) {
            next(error);
        }
    }

    // --- Common Links ---
    async createLink(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = linkSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newLink = await adminService.createLink(validation.data);
            res.status(201).json(newLink);
        } catch (error) {
            next(error);
        }
    }

    async updateLink(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = linkSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedLink = await adminService.updateLink(req.params.id, validation.data);
            res.json(updatedLink);
        } catch (error) {
            next(error);
        }
    }

    async deleteLink(req: Request, res: Response, next: NextFunction) {
        try {
            await adminService.deleteLink(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // --- Calendar ---
    async getCalendarEvents(req: Request, res: Response, next: NextFunction) {
        try {
            const { start, end, userId } = req.query;
            if (!start || !end) {
                throw new AppError('必须提供 start 和 end 查询参数', 400);
            }
            const events = await adminService.getCalendarEvents(start as string, end as string, userId as string);
            res.json(events);
        } catch (error) {
            next(error);
        }
    }

    async createCalendarEvent(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId: adminId } = (req as any).user;
            const validation = adminCalendarEventSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newEvent = await adminService.createCalendarEvent(validation.data, adminId);
            res.status(201).json(newEvent);
        } catch (error) {
            next(error);
        }
    }

    async updateCalendarEvent(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = adminCalendarEventUpdateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedEvent = await adminService.updateCalendarEvent(req.params.id, validation.data);
            res.json(updatedEvent);
        } catch (error) {
            next(error);
        }
    }

    async deleteCalendarEvent(req: Request, res: Response, next: NextFunction) {
        try {
            await adminService.deleteCalendarEvent(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new AdminController();
