"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const config_1 = __importDefault(require("../config/config"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class AuthService {
    async register(data) {
        const { username, password, nickname } = data;
        const operationRole = await prismaClient_1.default.role.findUnique({
            where: { name: 'operation' },
        });
        if (!operationRole) {
            throw new AppError_1.default('服务器配置错误：无法分配角色', 500);
        }
        const existingUser = await prismaClient_1.default.user.findUnique({
            where: { username },
        });
        if (existingUser) {
            throw new AppError_1.default('此用户名已被占用', 400);
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = await prismaClient_1.default.user.create({
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
    async login(data) {
        const { username, password } = data;
        const user = await prismaClient_1.default.user.findUnique({
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
            throw new AppError_1.default('认证失败：用户不存在', 401);
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new AppError_1.default('认证失败：密码错误', 401);
        }
        const permissions = user.role.menus.map((menu) => menu.key);
        const operatedCountries = user.operatedCountries.map((country) => country.code);
        const supervisedCountries = user.supervisedCountries.map((country) => country.code);
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            role: user.role.name,
            nickname: user.nickname,
            avatarUrl: user.avatarUrl,
            permissions,
            operatedCountries,
            supervisedCountries,
        }, config_1.default.JWT_SECRET, { expiresIn: '7d' });
        return {
            message: '登录成功!',
            token,
        };
    }
}
exports.default = new AuthService();
//# sourceMappingURL=authService.js.map