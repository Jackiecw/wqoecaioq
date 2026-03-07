import { Router } from 'express';
import { metricController } from '../controllers/metricController';
import { requirePermission } from '../middlewares/permissionMiddleware';

const router = Router();

router.get('/', requirePermission('ADMIN_METRICS:VIEW'), metricController.getAllMetrics);
router.get('/active', requirePermission('ADMIN_METRICS:VIEW'), metricController.getActiveMetrics);
router.post('/', requirePermission('ADMIN_METRICS:MANAGE'), metricController.createMetric);
router.put('/:id', requirePermission('ADMIN_METRICS:MANAGE'), metricController.updateMetric);
router.delete('/:id', requirePermission('ADMIN_METRICS:MANAGE'), metricController.deleteMetric);

export default router;
