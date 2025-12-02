import express from 'express';
import performanceController from '../controllers/performanceController';
import { authMiddleware } from '../middlewares/authMiddleware';
import reportController from '../controllers/reportController';

const router = express.Router();

router.use(authMiddleware);

// Reports
router.get('/reports', reportController.getReports);
router.post('/reports', reportController.createReport);
router.delete('/reports/:id', reportController.deleteReport);

// Templates
router.get('/templates', performanceController.getAllTemplates);
router.post('/templates', performanceController.createTemplate);

// Reviews
router.post('/reviews/assign', performanceController.assignReview);
router.get('/reviews/my', performanceController.getMyReviews);
router.get('/reviews/pending', performanceController.getPendingReviews);
router.get('/reviews/:id', performanceController.getReviewDetail);
router.put('/reviews/:id', performanceController.updateReview);

export default router;
