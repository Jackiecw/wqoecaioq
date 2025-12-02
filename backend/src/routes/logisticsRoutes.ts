import express from 'express';
import logisticsController from '../controllers/logisticsController';
import authMiddleware from '../middlewares/authMiddleware';
import adminMiddleware from '../middlewares/adminMiddleware';

const router = express.Router();

// Public (Authenticated) Routes
router.get('/production/batches', authMiddleware, logisticsController.getBatches);
router.get('/production/orders', authMiddleware, logisticsController.getOrders);
router.get('/production/orders/:id', authMiddleware, logisticsController.getOrderDetail);

// Admin Routes
router.get('/admin/production/export', adminMiddleware, logisticsController.exportOrders);
router.post('/admin/production/batches', adminMiddleware, logisticsController.createBatch);
router.post('/admin/production/orders', adminMiddleware, logisticsController.appendOrders);
router.post('/admin/production/orders/:id/status', adminMiddleware, logisticsController.updateOrderStatus);
router.post('/admin/production/orders/batch-status', adminMiddleware, logisticsController.batchUpdateOrderStatus);
router.patch('/admin/production/orders/:id', adminMiddleware, logisticsController.updateOrder);
router.delete('/admin/production/orders/:id', adminMiddleware, logisticsController.deleteOrder);
router.delete('/admin/production/batches/:id', adminMiddleware, logisticsController.deleteBatch);

export default router;
