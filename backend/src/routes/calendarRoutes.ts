import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import calendarController from '../controllers/calendarController';

const router = express.Router();

// Calendar routes - use authMiddleware since per-user access is controlled at the business logic level
// (users can create/edit/delete their own events; admin events are controlled separately)
router.use(authMiddleware);

router.get('/calendar/events', calendarController.listEvents);
router.post('/calendar/events', calendarController.createEvent);
router.put('/calendar/events/:id', calendarController.updateEvent);
router.delete('/calendar/events/:id', calendarController.deleteEvent);

router.get('/calendar/weekly-focus', calendarController.getWeeklyFocus);
router.put('/calendar/weekly-focus/:id', calendarController.updateWeeklyFocus);

export default router;
