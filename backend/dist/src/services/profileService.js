"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config/config"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const JWT_SECRET = config_1.default.JWT_SECRET;
class ProfileService {
    async changePassword(userId, data) {
        const { oldPassword, newPassword } = data;
        const user = await prismaClient_1.default.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true }
        });
        if (!user)
            throw new AppError_1.default('用户未找到', 404);
        const isPasswordValid = await bcryptjs_1.default.compare(oldPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new AppError_1.default('旧密码不正确', 401);
        }
        const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 10);
        await prismaClient_1.default.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        });
        return { message: '密码修改成功' };
    }
    async updateProfile(userId, data, file) {
        const { nickname } = data;
        const payload = { nickname };
        const oldUser = await prismaClient_1.default.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true }
        });
        if (file) {
            payload.avatarUrl = `/uploads/avatars/${file.filename}`;
            if (oldUser && oldUser.avatarUrl) {
                const oldPath = path_1.default.join(__dirname, '../../', oldUser.avatarUrl);
                if (fs_1.default.existsSync(oldPath)) {
                    try {
                        fs_1.default.unlinkSync(oldPath);
                    }
                    catch (err) {
                        console.error('Failed to delete old avatar:', err);
                    }
                }
            }
        }
        const updatedUser = await prismaClient_1.default.user.update({
            where: { id: userId },
            data: payload,
        });
        const userWithRoles = await prismaClient_1.default.user.findUnique({
            where: { id: userId },
            include: {
                role: { include: { menus: true } },
                operatedCountries: { select: { code: true } },
                supervisedCountries: { select: { code: true } }
            }
        });
        if (!userWithRoles)
            throw new AppError_1.default('用户数据异常', 500);
        const permissions = userWithRoles.role.menus.map(menu => menu.key);
        const operatedCountries = userWithRoles.operatedCountries.map(country => country.code);
        const supervisedCountries = userWithRoles.supervisedCountries.map(country => country.code);
        const newToken = jsonwebtoken_1.default.sign({
            userId: updatedUser.id,
            role: userWithRoles.role.name,
            nickname: updatedUser.nickname,
            avatarUrl: updatedUser.avatarUrl,
            permissions: permissions,
            operatedCountries: operatedCountries,
            supervisedCountries: supervisedCountries
        }, JWT_SECRET, { expiresIn: '7d' });
        const { passwordHash, ...userSafe } = updatedUser;
        return {
            message: '个人资料更新成功',
            token: newToken,
            user: userSafe
        };
    }
}
exports.ProfileService = ProfileService;
exports.default = new ProfileService();
//# sourceMappingURL=profileService.js.map