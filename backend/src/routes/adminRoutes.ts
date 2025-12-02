import express from 'express';
import adminController from '../controllers/adminController';
import adminMiddleware from '../middlewares/adminMiddleware';

const router = express.Router();

router.use(adminMiddleware);

// Users
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.post('/users/:id/reset-password', adminController.resetPassword);
router.delete('/users/:id', adminController.deleteUser);

// Roles
router.get('/roles', adminController.getAllRoles);
router.get('/roles/:id', adminController.getRoleById);
router.post('/roles', adminController.createRole);
router.put('/roles/:id', adminController.updateRole);

// Menu Items
router.get('/menu-items', adminController.getAllMenuItems);

// Common Links
router.post('/links', adminController.createLink);
router.put('/links/:id', adminController.updateLink);
router.delete('/links/:id', adminController.deleteLink);

// Calendar
router.get('/calendar/events', adminController.getCalendarEvents);
router.post('/calendar/events', adminController.createCalendarEvent);
router.put('/calendar/events/:id', adminController.updateCalendarEvent);
router.delete('/calendar/events/:id', adminController.deleteCalendarEvent);

export default router;
