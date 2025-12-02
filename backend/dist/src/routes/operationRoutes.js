"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const operationController_1 = __importDefault(require("../controllers/operationController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminMiddleware_1 = __importDefault(require("../middlewares/adminMiddleware"));
const router = express_1.default.Router();
// Public (Authenticated)
router.get('/operation/data', authMiddleware_1.authMiddleware, operationController_1.default.getModules);
// Admin
router.post('/admin/operation-modules', adminMiddleware_1.default, operationController_1.default.createModule);
router.post('/admin/operation-tasks', adminMiddleware_1.default, operationController_1.default.createTask);
router.put('/admin/operation-tasks/:id', adminMiddleware_1.default, operationController_1.default.updateTask);
router.put('/admin/operation-modules/:id', adminMiddleware_1.default, operationController_1.default.updateModule);
router.delete('/admin/operation-tasks/:id', adminMiddleware_1.default, operationController_1.default.deleteTask);
router.delete('/admin/operation-modules/:id', adminMiddleware_1.default, operationController_1.default.deleteModule);
exports.default = router;
//# sourceMappingURL=operationRoutes.js.map