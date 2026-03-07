import express from 'express';
import performanceController from '../controllers/performanceController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requirePermission } from '../middlewares/permissionMiddleware';
import reportController from '../controllers/reportController';

const router = express.Router();

// Reports - accessible to users who can fill/view reports
router.get('/reports', requirePermission('REPORTS:FILL'), reportController.getReports);
router.post('/reports', requirePermission('REPORTS:FILL'), reportController.createReport);
router.delete('/reports/:id', requirePermission('REPORTS:FILL'), reportController.deleteReport);

// Templates - admin/manager level
router.get('/templates', requirePermission('PERFORMANCE:VIEW'), performanceController.getAllTemplates);
router.post('/templates', requirePermission('PERFORMANCE:MANAGE'), performanceController.createTemplate);

// Reviews - accessible to users with performance view permission
router.post('/reviews/assign', requirePermission('PERFORMANCE:MANAGE'), performanceController.assignReview);
router.get('/reviews/my', authMiddleware, performanceController.getMyReviews);
router.get('/reviews/pending', requirePermission('PERFORMANCE:VIEW'), performanceController.getPendingReviews);
router.get('/reviews/:id', authMiddleware, performanceController.getReviewDetail);
router.put('/reviews/:id', authMiddleware, performanceController.updateReview);

export default router;
