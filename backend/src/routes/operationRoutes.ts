import express from 'express';
import operationController from '../controllers/operationController';
import authMiddleware from '../middlewares/authMiddleware';
import adminMiddleware from '../middlewares/adminMiddleware';

const router = express.Router();

// Public (Authenticated)
router.get('/operation/data', authMiddleware, operationController.getModules);

// Admin
router.post('/admin/operation-modules', adminMiddleware, operationController.createModule);
router.post('/admin/operation-tasks', adminMiddleware, operationController.createTask);
router.put('/admin/operation-tasks/:id', adminMiddleware, operationController.updateTask);
router.put('/admin/operation-modules/:id', adminMiddleware, operationController.updateModule);
router.delete('/admin/operation-tasks/:id', adminMiddleware, operationController.deleteTask);
router.delete('/admin/operation-modules/:id', adminMiddleware, operationController.deleteModule);

export default router;
