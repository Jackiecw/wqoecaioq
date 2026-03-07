import express from 'express';
import categoryController from '../controllers/categoryController';
import { requirePermission } from '../middlewares/permissionMiddleware';

const router = express.Router();

router.get('/', requirePermission('ADMIN_CATEGORIES:VIEW'), categoryController.getCategories);
router.post('/', requirePermission('ADMIN_CATEGORIES:MANAGE'), categoryController.createCategory);
router.put('/:id', requirePermission('ADMIN_CATEGORIES:MANAGE'), categoryController.updateCategory);
router.delete('/:id', requirePermission('ADMIN_CATEGORIES:MANAGE'), categoryController.deleteCategory);

export default router;
