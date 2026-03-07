import express from 'express';
import logisticsController from '../controllers/logisticsController';
import { requirePermission } from '../middlewares/permissionMiddleware';

const router = express.Router();

// Public (Authenticated) Routes - read operations
router.get('/production/batches', requirePermission('LOGISTICS:VIEW'), logisticsController.getBatches);
router.get('/production/orders', requirePermission('LOGISTICS:VIEW'), logisticsController.getOrders);
router.get('/production/orders/:id', requirePermission('LOGISTICS:VIEW'), logisticsController.getOrderDetail);

// Admin Routes - write operations
router.get('/admin/production/export', requirePermission('LOGISTICS:MANAGE'), logisticsController.exportOrders);
router.post('/admin/production/batches', requirePermission('LOGISTICS:MANAGE'), logisticsController.createBatch);
router.post('/admin/production/orders', requirePermission('LOGISTICS:MANAGE'), logisticsController.appendOrders);
router.post('/admin/production/orders/:id/status', requirePermission('LOGISTICS:MANAGE'), logisticsController.updateOrderStatus);
router.post('/admin/production/orders/batch-status', requirePermission('LOGISTICS:MANAGE'), logisticsController.batchUpdateOrderStatus);
router.patch('/admin/production/orders/:id', requirePermission('LOGISTICS:MANAGE'), logisticsController.updateOrder);
router.delete('/admin/production/orders/:id', requirePermission('LOGISTICS:MANAGE'), logisticsController.deleteOrder);
router.delete('/admin/production/batches/:id', requirePermission('LOGISTICS:MANAGE'), logisticsController.deleteBatch);

export default router;
