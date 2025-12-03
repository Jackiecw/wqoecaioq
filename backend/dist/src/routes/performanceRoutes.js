"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const performanceController_1 = __importDefault(require("../controllers/performanceController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const reportController_1 = __importDefault(require("../controllers/reportController"));
const router = express_1.default.Router();
router.use(authMiddleware_1.authMiddleware);
// Reports
router.get('/reports', reportController_1.default.getReports);
router.post('/reports', reportController_1.default.createReport);
router.delete('/reports/:id', reportController_1.default.deleteReport);
// Templates
router.get('/templates', performanceController_1.default.getAllTemplates);
router.post('/templates', performanceController_1.default.createTemplate);
// Reviews
router.post('/reviews/assign', performanceController_1.default.assignReview);
router.get('/reviews/my', performanceController_1.default.getMyReviews);
router.get('/reviews/pending', performanceController_1.default.getPendingReviews);
router.get('/reviews/:id', performanceController_1.default.getReviewDetail);
router.put('/reviews/:id', performanceController_1.default.updateReview);
exports.default = router;
//# sourceMappingURL=performanceRoutes.js.map