"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const profileService_1 = __importDefault(require("../services/profileService"));
const zod_1 = require("zod");
const AppError_1 = __importDefault(require("../utils/AppError"));
const fs_1 = __importDefault(require("fs"));
// --- Zod Schemas ---
const changePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(1, "必须提供旧密码"),
    newPassword: zod_1.z.string().min(8, "新密码至少需要8个字符"),
});
const updateProfileSchema = zod_1.z.object({
    nickname: zod_1.z.string().min(1, "昵称不能为空"),
});
class ProfileController {
    async changePassword(req, res, next) {
        try {
            const { userId } = req.user;
            const validation = changePasswordSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const result = await profileService_1.default.changePassword(userId, validation.data);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const { userId } = req.user;
            const validation = updateProfileSchema.safeParse(req.body);
            if (!validation.success) {
                if (req.file)
                    fs_1.default.unlinkSync(req.file.path);
                throw new AppError_1.default(`输入数据无效: ${JSON.stringify(validation.error.errors)}`, 400);
            }
            const result = await profileService_1.default.updateProfile(userId, validation.data, req.file);
            res.json(result);
        }
        catch (error) {
            if (req.file) {
                try {
                    fs_1.default.unlinkSync(req.file.path);
                }
                catch (err) {
                    console.error('Failed to delete uploaded file on error:', err);
                }
            }
            next(error);
        }
    }
}
exports.ProfileController = ProfileController;
exports.default = new ProfileController();
//# sourceMappingURL=profileController.js.map