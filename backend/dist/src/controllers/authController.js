"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authService_1 = __importDefault(require("../services/authService"));
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, "用户名至少需要3个字符"),
    password: zod_1.z.string().min(8, "密码至少需要8个字符"),
    nickname: zod_1.z.string().min(1, "昵称不能为空"),
});
const loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, "用户名不能为空"),
    password: zod_1.z.string().min(1, "密码不能为空")
});
class AuthController {
    async register(req, res, next) {
        try {
            const validation = registerSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: '输入数据无效',
                    details: validation.error.errors,
                });
            }
            const user = await authService_1.default.register(validation.data);
            res.status(201).json(user);
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const validation = loginSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: '输入数据无效',
                    details: validation.error.errors,
                });
            }
            const result = await authService_1.default.login(validation.data);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new AuthController();
//# sourceMappingURL=authController.js.map