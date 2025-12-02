"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = __importDefault(require("../controllers/adminController"));
const adminMiddleware_1 = __importDefault(require("../middlewares/adminMiddleware"));
const router = express_1.default.Router();
router.use(adminMiddleware_1.default);
// Users
router.get('/users', adminController_1.default.getAllUsers);
router.get('/users/:id', adminController_1.default.getUserById);
router.post('/users', adminController_1.default.createUser);
router.put('/users/:id', adminController_1.default.updateUser);
router.post('/users/:id/reset-password', adminController_1.default.resetPassword);
router.delete('/users/:id', adminController_1.default.deleteUser);
// Roles
router.get('/roles', adminController_1.default.getAllRoles);
router.get('/roles/:id', adminController_1.default.getRoleById);
router.post('/roles', adminController_1.default.createRole);
router.put('/roles/:id', adminController_1.default.updateRole);
// Menu Items
router.get('/menu-items', adminController_1.default.getAllMenuItems);
// Common Links
router.post('/links', adminController_1.default.createLink);
router.put('/links/:id', adminController_1.default.updateLink);
router.delete('/links/:id', adminController_1.default.deleteLink);
// Calendar
router.get('/calendar/events', adminController_1.default.getCalendarEvents);
router.post('/calendar/events', adminController_1.default.createCalendarEvent);
router.put('/calendar/events/:id', adminController_1.default.updateCalendarEvent);
router.delete('/calendar/events/:id', adminController_1.default.deleteCalendarEvent);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map