import express from 'express';
import adminController from '../controllers/adminController';
import { requirePermission } from '../middlewares/permissionMiddleware';

const router = express.Router();

// Users
router.get('/users', requirePermission('ADMIN_USERS:VIEW'), adminController.getAllUsers);
router.get('/users/:id', requirePermission('ADMIN_USERS:VIEW'), adminController.getUserById);
router.post('/users', requirePermission('ADMIN_USERS:MANAGE'), adminController.createUser);
router.put('/users/:id', requirePermission('ADMIN_USERS:MANAGE'), adminController.updateUser);
router.post('/users/:id/reset-password', requirePermission('ADMIN_USERS:MANAGE'), adminController.resetPassword);
router.delete('/users/:id', requirePermission('ADMIN_USERS:MANAGE'), adminController.deleteUser);

// Roles
router.get('/roles', requirePermission('ADMIN_ROLES:VIEW'), adminController.getAllRoles);
router.get('/roles/:id', requirePermission('ADMIN_ROLES:VIEW'), adminController.getRoleById);
router.post('/roles', requirePermission('ADMIN_ROLES:MANAGE'), adminController.createRole);
router.put('/roles/:id', requirePermission('ADMIN_ROLES:MANAGE'), adminController.updateRole);

// Permissions
router.get('/permissions', requirePermission('ADMIN_ROLES:VIEW'), adminController.getAllPermissions);

// Common Links
router.post('/links', requirePermission('LINKS:MANAGE'), adminController.createLink);
router.put('/links/:id', requirePermission('LINKS:MANAGE'), adminController.updateLink);
router.delete('/links/:id', requirePermission('LINKS:MANAGE'), adminController.deleteLink);

// Calendar (admin-created events for other users)
router.get('/calendar/events', requirePermission('CALENDAR:MANAGE'), adminController.getCalendarEvents);
router.post('/calendar/events', requirePermission('CALENDAR:MANAGE'), adminController.createCalendarEvent);
router.put('/calendar/events/:id', requirePermission('CALENDAR:MANAGE'), adminController.updateCalendarEvent);
router.delete('/calendar/events/:id', requirePermission('CALENDAR:MANAGE'), adminController.deleteCalendarEvent);

export default router;
