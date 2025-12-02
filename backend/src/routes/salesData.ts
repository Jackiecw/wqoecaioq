import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import salesController from '../controllers/salesController';

const router = express.Router();

// Create Sales Data
router.post('/sales', authMiddleware, salesController.create);

// Get Sales Data List
router.get('/sales-data', authMiddleware, salesController.findAll);

// Get Sales Stats
router.get('/sales-data/stats', authMiddleware, salesController.getStats);

// Get Stores List (Public/Auth)
router.get('/stores-list', authMiddleware, salesController.getStoresList);

// Update Sales Data
router.put('/sales-data/:id', authMiddleware, salesController.update);

// Delete Sales Data
router.delete('/sales-data/:id', authMiddleware, salesController.delete);

export default router;
