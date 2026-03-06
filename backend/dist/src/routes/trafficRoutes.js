"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trafficController_1 = require("../controllers/trafficController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', trafficController_1.trafficController.getAll);
router.post('/', trafficController_1.trafficController.create);
router.put('/:id', trafficController_1.trafficController.update);
router.delete('/:id', trafficController_1.trafficController.delete);
const dynamicImportController_1 = require("../controllers/dynamicImportController");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const upload = (0, multer_1.default)({ dest: 'uploads/temp/' });
if (!fs_1.default.existsSync('uploads/temp/')) {
    fs_1.default.mkdirSync('uploads/temp/', { recursive: true });
}
router.post('/import/preview', upload.single('file'), dynamicImportController_1.dynamicImportController.previewTraffic);
router.post('/import/confirm', dynamicImportController_1.dynamicImportController.confirmTraffic);
exports.default = router;
//# sourceMappingURL=trafficRoutes.js.map