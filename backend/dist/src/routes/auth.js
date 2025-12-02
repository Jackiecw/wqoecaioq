"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = __importDefault(require("../controllers/authController"));
const loginRateLimiter_1 = __importDefault(require("../../loginRateLimiter"));
const router = express_1.default.Router();
router.post('/register', authController_1.default.register);
router.post('/login', loginRateLimiter_1.default, authController_1.default.login);
exports.default = router;
//# sourceMappingURL=auth.js.map