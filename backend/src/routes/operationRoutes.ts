import express from 'express';
import operationController from '../controllers/operationController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requirePermission } from '../middlewares/permissionMiddleware';

const router = express.Router();

// Public (Authenticated) - basic data accessible to all logged-in users
router.get('/operation/data', authMiddleware, operationController.getModules);
router.get('/countries', authMiddleware, operationController.getCountries);
router.get('/links', authMiddleware, operationController.getLinks);
router.get('/rates', authMiddleware, operationController.getRates);
router.post('/rates/refresh', authMiddleware, operationController.refreshRates);

// Admin - operation module/task management
router.post('/admin/operation-modules', requirePermission('STORE_LISTINGS:MANAGE'), operationController.createModule);
router.post('/admin/operation-tasks', requirePermission('STORE_LISTINGS:MANAGE'), operationController.createTask);
router.put('/admin/operation-tasks/:id', requirePermission('STORE_LISTINGS:MANAGE'), operationController.updateTask);
router.put('/admin/operation-modules/:id', requirePermission('STORE_LISTINGS:MANAGE'), operationController.updateModule);
router.delete('/admin/operation-tasks/:id', requirePermission('STORE_LISTINGS:MANAGE'), operationController.deleteTask);
router.delete('/admin/operation-modules/:id', requirePermission('STORE_LISTINGS:MANAGE'), operationController.deleteModule);

export default router;
