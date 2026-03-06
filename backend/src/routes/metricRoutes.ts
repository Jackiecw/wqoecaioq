import { Router } from 'express';
import { metricController } from '../controllers/metricController';
import { authMiddleware } from '../middlewares/authMiddleware';
import adminMiddleware from '../middlewares/adminMiddleware';

const router = Router();

// 仅管理员可以管理指标定义
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', metricController.getAllMetrics);
router.get('/active', metricController.getActiveMetrics);
router.post('/', metricController.createMetric);
router.put('/:id', metricController.updateMetric);
router.delete('/:id', metricController.deleteMetric);

export default router;
