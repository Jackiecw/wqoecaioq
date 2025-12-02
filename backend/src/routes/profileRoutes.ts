import express from 'express';
import profileController from '../controllers/profileController';
import { authMiddleware } from '../middlewares/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// --- Multer Configuration ---
const uploadDir = path.join(__dirname, '../../uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const userId = (req as any).user.userId;
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        cb(null, `user-${userId}-${timestamp}${extension}`);
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('只允许上传图片文件!'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 2 } // 2MB
});

// --- Routes ---
router.use(authMiddleware);

router.post('/profile/change-password', profileController.changePassword);
router.put('/profile/update-details', upload.single('avatarImage'), profileController.updateProfile);

export default router;
