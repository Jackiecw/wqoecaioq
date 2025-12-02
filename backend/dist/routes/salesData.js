"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../src/middlewares/authMiddleware");
const salesController_1 = __importDefault(require("../src/controllers/salesController"));
const router = express_1.default.Router();
// Create Sales Data
router.post('/sales', authMiddleware_1.authMiddleware, salesController_1.default.create);
// Get Sales Data List
router.get('/sales-data', authMiddleware_1.authMiddleware, salesController_1.default.findAll);
// Get Sales Stats
router.get('/sales-data/stats', authMiddleware_1.authMiddleware, salesController_1.default.getStats);
// Update Sales Data
router.put('/sales-data/:id', authMiddleware_1.authMiddleware, salesController_1.default.update);
// Delete Sales Data
router.delete('/sales-data/:id', authMiddleware_1.authMiddleware, salesController_1.default.delete);
exports.default = router;
//# sourceMappingURL=salesData.js.map