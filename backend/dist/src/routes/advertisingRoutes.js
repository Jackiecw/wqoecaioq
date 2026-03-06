"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const advertisingController_1 = require("../controllers/advertisingController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', advertisingController_1.advertisingController.getAll);
router.post('/', advertisingController_1.advertisingController.create);
router.put('/:id', advertisingController_1.advertisingController.update);
router.delete('/:id', advertisingController_1.advertisingController.delete);
const dynamicImportController_1 = require("../controllers/dynamicImportController");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const upload = (0, multer_1.default)({ dest: 'uploads/temp/' });
if (!fs_1.default.existsSync('uploads/temp/')) {
    fs_1.default.mkdirSync('uploads/temp/', { recursive: true });
}
router.post('/import/preview', upload.single('file'), dynamicImportController_1.dynamicImportController.previewAdvertising);
router.post('/import/confirm', dynamicImportController_1.dynamicImportController.confirmAdvertising);
exports.default = router;
//# sourceMappingURL=advertisingRoutes.js.map