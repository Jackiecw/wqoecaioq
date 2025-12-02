"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const profileController_1 = __importDefault(require("../controllers/profileController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
// --- Multer Configuration ---
const uploadDir = path_1.default.join(__dirname, '../../uploads', 'avatars');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const userId = req.user.userId;
        const timestamp = Date.now();
        const extension = path_1.default.extname(file.originalname);
        cb(null, `user-${userId}-${timestamp}${extension}`);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('只允许上传图片文件!'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 2 } // 2MB
});
// --- Routes ---
router.use(authMiddleware_1.authMiddleware);
router.post('/profile/change-password', profileController_1.default.changePassword);
router.put('/profile/update-details', upload.single('avatarImage'), profileController_1.default.updateProfile);
exports.default = router;
//# sourceMappingURL=profileRoutes.js.map