"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const financeController_1 = __importDefault(require("../controllers/financeController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminMiddleware_1 = __importDefault(require("../middlewares/adminMiddleware"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
// Multer Configuration for Excel
const tempUploadDir = path_1.default.join(process.cwd(), 'uploads', 'temp');
if (!fs_1.default.existsSync(tempUploadDir)) {
    fs_1.default.mkdirSync(tempUploadDir, { recursive: true });
}
const excelStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempUploadDir);
    },
    filename: (req, file, cb) => {
        // Use UTF-8 safe filename handling if needed, but timestamp prefix is usually safe
        // file.originalname might contain Chinese, but diskStorage handles it generally ok on modern Node
        // We can encode it if we want to be extra safe, but keeping original logic is fine
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const excelFilter = (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
        file.mimetype === 'application/vnd.ms-excel' // .xls
    ) {
        cb(null, true);
    }
    else {
        cb(new Error('只允许上传 Excel 文件! (.xlsx, .xls)'));
    }
};
const upload = (0, multer_1.default)({
    storage: excelStorage,
    fileFilter: excelFilter,
    limits: { fileSize: 1024 * 1024 * 10 } // 10MB
});
// Routes
// Public (Authenticated) Options
router.get('/expenses/options', authMiddleware_1.authMiddleware, financeController_1.default.getOptions);
// User Create Expense
router.post('/expenses', authMiddleware_1.authMiddleware, financeController_1.default.createExpense);
// Admin/Supervisor Routes
router.get('/admin/expenses', adminMiddleware_1.default, financeController_1.default.getExpenses);
router.post('/admin/expenses/import', adminMiddleware_1.default, upload.single('expenseFile'), financeController_1.default.importExpenses);
router.get('/admin/expenses/export', adminMiddleware_1.default, financeController_1.default.exportExpenses);
router.put('/admin/expenses/:id', adminMiddleware_1.default, financeController_1.default.updateExpense);
router.delete('/admin/expenses/:id', adminMiddleware_1.default, financeController_1.default.deleteExpense);
exports.default = router;
//# sourceMappingURL=financeRoutes.js.map