"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const adminService_1 = __importDefault(require("../services/adminService"));
const zod_1 = require("zod");
const AppError_1 = __importDefault(require("../utils/AppError"));
// --- Zod Schemas ---
const userCreateSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, "用户名至少需要3个字符"),
    password: zod_1.z.string().min(8, "密码至少需要8个字符"),
    nickname: zod_1.z.string().min(1, "昵称不能为空"),
    roleId: zod_1.z.string().min(1, "必须选择一个角色"),
    supervisedCountryIds: zod_1.z.array(zod_1.z.string()).optional(),
    operatedCountryIds: zod_1.z.array(zod_1.z.string()).optional(),
});
const userUpdateSchema = zod_1.z.object({
    nickname: zod_1.z.string().min(1, "昵称不能为空"),
    roleId: zod_1.z.string().min(1, "必须选择一个角色"),
    supervisedCountryIds: zod_1.z.array(zod_1.z.string()).optional(),
    operatedCountryIds: zod_1.z.array(zod_1.z.string()).optional(),
});
const roleSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "角色名 (key) 至少需要2个字符"),
    description: zod_1.z.string().min(1, "角色描述不能为空"),
    menuIds: zod_1.z.array(zod_1.z.string()).default([]),
});
const linkSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "标题不能为空"),
    url: zod_1.z.string().url("必须是有效的 URL (例如: https://...)"),
    description: zod_1.z.string().optional().nullable(),
    displayOrder: zod_1.z.coerce.number().int().default(0),
});
const adminCalendarEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "标题不能为空"),
    startAt: zod_1.z.string().datetime("开始时间无效"),
    endAt: zod_1.z.string().datetime("结束时间无效"),
    isAllDay: zod_1.z.boolean().default(false),
    color: zod_1.z.string().default('blue'),
    userId: zod_1.z.string().min(1, "必须指定一个用户"),
});
const adminCalendarEventUpdateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "标题不能为空").optional(),
    startAt: zod_1.z.string().datetime("开始时间无效").optional(),
    endAt: zod_1.z.string().datetime("结束时间无效").optional(),
    isAllDay: zod_1.z.boolean().optional(),
    color: zod_1.z.string().optional(),
    userId: zod_1.z.string().min(1, "必须指定一个用户").optional(),
});
class AdminController {
    // --- Users ---
    async getAllUsers(req, res, next) {
        try {
            const users = await adminService_1.default.getAllUsers();
            res.json(users);
        }
        catch (error) {
            next(error);
        }
    }
    async getUserById(req, res, next) {
        try {
            const user = await adminService_1.default.getUserById(req.params.id);
            res.json(user);
        }
        catch (error) {
            next(error);
        }
    }
    async createUser(req, res, next) {
        try {
            const validation = userCreateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newUser = await adminService_1.default.createUser(validation.data);
            res.status(201).json(newUser);
        }
        catch (error) {
            next(error);
        }
    }
    async updateUser(req, res, next) {
        try {
            const validation = userUpdateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedUser = await adminService_1.default.updateUser(req.params.id, validation.data);
            res.json(updatedUser);
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const result = await adminService_1.default.resetPassword(req.params.id);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteUser(req, res, next) {
        try {
            const { userId } = req.user;
            await adminService_1.default.deleteUser(req.params.id, userId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    // --- Roles ---
    async getAllRoles(req, res, next) {
        try {
            const roles = await adminService_1.default.getAllRoles();
            res.json(roles);
        }
        catch (error) {
            next(error);
        }
    }
    async getRoleById(req, res, next) {
        try {
            const role = await adminService_1.default.getRoleById(req.params.id);
            res.json(role);
        }
        catch (error) {
            next(error);
        }
    }
    async createRole(req, res, next) {
        try {
            const validation = roleSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newRole = await adminService_1.default.createRole(validation.data);
            res.status(201).json(newRole);
        }
        catch (error) {
            next(error);
        }
    }
    async updateRole(req, res, next) {
        try {
            const validation = roleSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedRole = await adminService_1.default.updateRole(req.params.id, validation.data);
            res.json(updatedRole);
        }
        catch (error) {
            next(error);
        }
    }
    // --- Menu Items ---
    async getAllMenuItems(req, res, next) {
        try {
            const items = await adminService_1.default.getAllMenuItems();
            res.json(items);
        }
        catch (error) {
            next(error);
        }
    }
    // --- Common Links ---
    async createLink(req, res, next) {
        try {
            const validation = linkSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newLink = await adminService_1.default.createLink(validation.data);
            res.status(201).json(newLink);
        }
        catch (error) {
            next(error);
        }
    }
    async updateLink(req, res, next) {
        try {
            const validation = linkSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedLink = await adminService_1.default.updateLink(req.params.id, validation.data);
            res.json(updatedLink);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteLink(req, res, next) {
        try {
            await adminService_1.default.deleteLink(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    // --- Calendar ---
    async getCalendarEvents(req, res, next) {
        try {
            const { start, end, userId } = req.query;
            if (!start || !end) {
                throw new AppError_1.default('必须提供 start 和 end 查询参数', 400);
            }
            const events = await adminService_1.default.getCalendarEvents(start, end, userId);
            res.json(events);
        }
        catch (error) {
            next(error);
        }
    }
    async createCalendarEvent(req, res, next) {
        try {
            const { userId: adminId } = req.user;
            const validation = adminCalendarEventSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const newEvent = await adminService_1.default.createCalendarEvent(validation.data, adminId);
            res.status(201).json(newEvent);
        }
        catch (error) {
            next(error);
        }
    }
    async updateCalendarEvent(req, res, next) {
        try {
            const validation = adminCalendarEventUpdateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const updatedEvent = await adminService_1.default.updateCalendarEvent(req.params.id, validation.data);
            res.json(updatedEvent);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteCalendarEvent(req, res, next) {
        try {
            await adminService_1.default.deleteCalendarEvent(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AdminController = AdminController;
exports.default = new AdminController();
//# sourceMappingURL=adminController.js.map