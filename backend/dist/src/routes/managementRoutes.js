"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const managementController_1 = __importDefault(require("../controllers/managementController"));
const adminMiddleware_1 = __importDefault(require("../middlewares/adminMiddleware"));
const router = express_1.default.Router();
router.use(adminMiddleware_1.default);
// Options
router.get('/management-options', managementController_1.default.getOptions);
// Stores
router.get('/stores', managementController_1.default.getAllStores);
router.get('/stores/:id', managementController_1.default.getStoreById);
router.post('/stores', managementController_1.default.createStore);
router.put('/stores/:id', managementController_1.default.updateStore);
router.delete('/stores/:id', managementController_1.default.deleteStore);
// Countries
router.get('/countries', managementController_1.default.getAllCountries);
router.post('/countries', managementController_1.default.createCountry);
router.put('/countries/:id', managementController_1.default.updateCountry);
exports.default = router;
//# sourceMappingURL=managementRoutes.js.map