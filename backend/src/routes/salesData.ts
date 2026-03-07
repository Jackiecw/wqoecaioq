import express from 'express';
import salesController from '../controllers/salesController';
import { requirePermission } from '../middlewares/permissionMiddleware';

const router = express.Router();

// Create Sales Data
router.post('/sales', requirePermission('SALES:EDIT'), salesController.create);

// Get Sales Data List
router.get('/sales-data', requirePermission('SALES:VIEW'), salesController.findAll);

// Get Sales Stats
router.get('/sales-data/stats', requirePermission('SALES:VIEW'), salesController.getStats);

// Get Stores List (Public/Auth)
router.get('/stores-list', requirePermission('SALES:VIEW'), salesController.getStoresList);

// Update Sales Data
router.put('/sales-data/:id', requirePermission('SALES:EDIT'), salesController.update);

// Delete Sales Data
router.delete('/sales-data/:id', requirePermission('SALES:EDIT'), salesController.delete);

export default router;
