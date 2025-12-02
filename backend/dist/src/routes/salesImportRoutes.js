"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const salesImportController_1 = __importDefault(require("../controllers/salesImportController"));
const router = express_1.default.Router();
// Configure Multer for temporary storage
const upload = (0, multer_1.default)({ dest: 'uploads/temp/' });
// Ensure temp dir exists
if (!fs_1.default.existsSync('uploads/temp/')) {
    fs_1.default.mkdirSync('uploads/temp/', { recursive: true });
}
// Apply auth middleware to all routes
router.use(authMiddleware_1.authMiddleware);
// POST /sales-import/preview
router.post('/sales-import/preview', upload.single('file'), salesImportController_1.default.preview);
// POST /sales-import/confirm
router.post('/sales-import/confirm', salesImportController_1.default.confirm);
// GET /sales-import/batches (Import History)
router.get('/sales-import/batches', salesImportController_1.default.getBatches);
// DELETE /sales-import/batch/:id (Rollback)
router.delete('/sales-import/batch/:id', salesImportController_1.default.rollback);
exports.default = router;
//# sourceMappingURL=salesImportRoutes.js.map