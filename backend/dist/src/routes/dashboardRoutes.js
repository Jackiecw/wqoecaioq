"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const dashboardController_1 = __importDefault(require("../controllers/dashboardController"));
const todoController_1 = __importDefault(require("../controllers/todoController"));
const recurringTaskController_1 = __importDefault(require("../controllers/recurringTaskController"));
const router = express_1.default.Router();
router.use(authMiddleware_1.authMiddleware);
// Dashboard
router.get('/dashboard/filter-options', dashboardController_1.default.getFilterOptions);
router.get('/dashboard/summary', dashboardController_1.default.getSummary);
// Todos
router.get('/todos', todoController_1.default.list);
router.post('/todos', todoController_1.default.create);
router.put('/todos/:id', todoController_1.default.update);
router.delete('/todos/:id', todoController_1.default.remove);
// Recurring Tasks
router.get('/recurring-tasks', recurringTaskController_1.default.list);
router.post('/recurring-tasks', recurringTaskController_1.default.create);
router.put('/recurring-tasks/:id/toggle', recurringTaskController_1.default.toggle);
router.delete('/recurring-tasks/:id', recurringTaskController_1.default.remove);
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map