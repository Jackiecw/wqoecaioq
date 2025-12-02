"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logisticsController_1 = __importDefault(require("../controllers/logisticsController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminMiddleware_1 = __importDefault(require("../middlewares/adminMiddleware"));
const router = express_1.default.Router();
// Public (Authenticated) Routes
router.get('/production/batches', authMiddleware_1.authMiddleware, logisticsController_1.default.getBatches);
router.get('/production/orders', authMiddleware_1.authMiddleware, logisticsController_1.default.getOrders);
router.get('/production/orders/:id', authMiddleware_1.authMiddleware, logisticsController_1.default.getOrderDetail);
// Admin Routes
router.get('/admin/production/export', adminMiddleware_1.default, logisticsController_1.default.exportOrders);
router.post('/admin/production/batches', adminMiddleware_1.default, logisticsController_1.default.createBatch);
router.post('/admin/production/orders', adminMiddleware_1.default, logisticsController_1.default.appendOrders);
router.post('/admin/production/orders/:id/status', adminMiddleware_1.default, logisticsController_1.default.updateOrderStatus);
router.post('/admin/production/orders/batch-status', adminMiddleware_1.default, logisticsController_1.default.batchUpdateOrderStatus);
router.patch('/admin/production/orders/:id', adminMiddleware_1.default, logisticsController_1.default.updateOrder);
router.delete('/admin/production/orders/:id', adminMiddleware_1.default, logisticsController_1.default.deleteOrder);
router.delete('/admin/production/batches/:id', adminMiddleware_1.default, logisticsController_1.default.deleteBatch);
exports.default = router;
//# sourceMappingURL=logisticsRoutes.js.map