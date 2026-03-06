"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const categoryController_1 = __importDefault(require("../controllers/categoryController"));
const adminMiddleware_1 = __importDefault(require("../middlewares/adminMiddleware"));
const router = express_1.default.Router();
router.use(adminMiddleware_1.default);
router.get('/', categoryController_1.default.getCategories);
router.post('/', categoryController_1.default.createCategory);
router.put('/:id', categoryController_1.default.updateCategory);
router.delete('/:id', categoryController_1.default.deleteCategory);
exports.default = router;
//# sourceMappingURL=categoryRoutes.js.map