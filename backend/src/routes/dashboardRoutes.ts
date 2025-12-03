import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import dashboardController from '../controllers/dashboardController';
import todoController from '../controllers/todoController';
import recurringTaskController from '../controllers/recurringTaskController';

const router = express.Router();

router.use(authMiddleware);

// Dashboard
router.get('/dashboard/filter-options', dashboardController.getFilterOptions);
router.get('/dashboard/summary', dashboardController.getSummary);

// Todos
router.get('/todos', todoController.list);
router.post('/todos', todoController.create);
router.put('/todos/:id', todoController.update);
router.delete('/todos/:id', todoController.remove);

// Recurring Tasks
router.get('/recurring-tasks', recurringTaskController.list);
router.post('/recurring-tasks', recurringTaskController.create);
router.put('/recurring-tasks/:id/toggle', recurringTaskController.toggle);
router.delete('/recurring-tasks/:id', recurringTaskController.remove);

export default router;
