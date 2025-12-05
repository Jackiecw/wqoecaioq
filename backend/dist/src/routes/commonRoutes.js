"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const commonController_1 = __importDefault(require("../controllers/commonController"));
const router = express_1.default.Router();
router.use(authMiddleware_1.authMiddleware);
router.get('/countries', commonController_1.default.getCountries);
router.get('/stores', commonController_1.default.getStores);
router.get('/exchange-rates', commonController_1.default.getExchangeRates);
router.post('/exchange-rates/refresh', commonController_1.default.refreshExchangeRates);
router.get('/exchange-rates/refresh-quota', commonController_1.default.getRefreshQuota);
exports.default = router;
//# sourceMappingURL=commonRoutes.js.map