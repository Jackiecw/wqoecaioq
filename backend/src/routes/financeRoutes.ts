import express from 'express';
import financeController from '../controllers/financeController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requirePermission } from '../middlewares/permissionMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Multer Configuration for Excel
const tempUploadDir = path.join(process.cwd(), 'uploads', 'temp');
if (!fs.existsSync(tempUploadDir)) {
    fs.mkdirSync(tempUploadDir, { recursive: true });
}

const excelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempUploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const excelFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
        file.mimetype === 'application/vnd.ms-excel' // .xls
    ) {
        cb(null, true);
    } else {
        cb(new Error('只允许上传 Excel 文件! (.xlsx, .xls)'));
    }
};

const upload = multer({
    storage: excelStorage,
    fileFilter: excelFilter,
    limits: { fileSize: 1024 * 1024 * 10 } // 10MB
});

// Routes

// Public (Authenticated) Options
router.get('/expenses/options', authMiddleware, financeController.getOptions);

// User Create Expense
router.post('/expenses', requirePermission('FINANCE:ENTRY'), financeController.createExpense);

// Admin/Supervisor Routes
router.get('/admin/expenses', requirePermission('FINANCE:VIEW'), financeController.getExpenses);
router.post('/admin/expenses/import', requirePermission('FINANCE:MANAGE'), upload.single('expenseFile'), financeController.importExpenses);
router.get('/admin/expenses/export', requirePermission('FINANCE:EXPORT'), financeController.exportExpenses);
router.put('/admin/expenses/:id', requirePermission('FINANCE:MANAGE'), financeController.updateExpense);
router.delete('/admin/expenses/:id', requirePermission('FINANCE:MANAGE'), financeController.deleteExpense);

export default router;
