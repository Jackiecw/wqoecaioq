import express from 'express';
import categoryController from '../controllers/categoryController';
import adminMiddleware from '../middlewares/adminMiddleware';

const router = express.Router();

router.use(adminMiddleware);

router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;
