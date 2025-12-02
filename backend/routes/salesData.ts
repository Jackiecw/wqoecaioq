import express from 'express';
import authMiddleware from '../src/middlewares/authMiddleware';
import salesController from '../src/controllers/salesController';

const router = express.Router();

// Create Sales Data
router.post('/sales', authMiddleware, salesController.create);

// Get Sales Data List
router.get('/sales-data', authMiddleware, salesController.findAll);

// Get Sales Stats
router.get('/sales-data/stats', authMiddleware, salesController.getStats);

// Update Sales Data
router.put('/sales-data/:id', authMiddleware, salesController.update);

// Delete Sales Data
router.delete('/sales-data/:id', authMiddleware, salesController.delete);

export default router;
