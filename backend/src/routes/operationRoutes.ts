import express from 'express';
import operationController from '../controllers/operationController';
import { authMiddleware } from '../middlewares/authMiddleware';
import adminMiddleware from '../middlewares/adminMiddleware';

const router = express.Router();

// Public (Authenticated)
router.get('/operation/data', authMiddleware, operationController.getModules);
router.get('/countries', authMiddleware, operationController.getCountries);
router.get('/links', authMiddleware, operationController.getLinks);
router.get('/rates', authMiddleware, operationController.getRates);
router.post('/rates/refresh', authMiddleware, operationController.refreshRates);

// Admin
router.post('/admin/operation-modules', adminMiddleware, operationController.createModule);
router.post('/admin/operation-tasks', adminMiddleware, operationController.createTask);
router.put('/admin/operation-tasks/:id', adminMiddleware, operationController.updateTask);
router.put('/admin/operation-modules/:id', adminMiddleware, operationController.updateModule);
router.delete('/admin/operation-tasks/:id', adminMiddleware, operationController.deleteTask);
router.delete('/admin/operation-modules/:id', adminMiddleware, operationController.deleteModule);

export default router;
