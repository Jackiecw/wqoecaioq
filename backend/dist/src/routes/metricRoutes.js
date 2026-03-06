"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const metricController_1 = require("../controllers/metricController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminMiddleware_1 = __importDefault(require("../middlewares/adminMiddleware"));
const router = (0, express_1.Router)();
// 仅管理员可以管理指标定义
router.use(authMiddleware_1.authMiddleware);
router.use(adminMiddleware_1.default);
router.get('/', metricController_1.metricController.getAllMetrics);
router.get('/active', metricController_1.metricController.getActiveMetrics);
router.post('/', metricController_1.metricController.createMetric);
router.put('/:id', metricController_1.metricController.updateMetric);
router.delete('/:id', metricController_1.metricController.deleteMetric);
exports.default = router;
//# sourceMappingURL=metricRoutes.js.map