"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const calendarController_1 = __importDefault(require("../controllers/calendarController"));
const router = express_1.default.Router();
router.use(authMiddleware_1.authMiddleware);
router.get('/calendar/events', calendarController_1.default.listEvents);
router.post('/calendar/events', calendarController_1.default.createEvent);
router.put('/calendar/events/:id', calendarController_1.default.updateEvent);
router.delete('/calendar/events/:id', calendarController_1.default.deleteEvent);
router.get('/calendar/weekly-focus', calendarController_1.default.getWeeklyFocus);
router.put('/calendar/weekly-focus/:id', calendarController_1.default.updateWeeklyFocus);
exports.default = router;
//# sourceMappingURL=calendarRoutes.js.map