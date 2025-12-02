import express from 'express';
import performanceController from '../controllers/performanceController';
import authMiddleware from '../middlewares/authMiddleware';

const router = express.Router();

router.use(authMiddleware);

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
