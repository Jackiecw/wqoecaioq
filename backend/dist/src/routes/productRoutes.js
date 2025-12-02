"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_1 = __importDefault(require("../controllers/productController"));
const adminMiddleware_1 = __importDefault(require("../middlewares/adminMiddleware"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
// Multer Configuration
const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'products');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const sku = req.body.sku || 'temp';
        const timestamp = Date.now();
        const extension = path_1.default.extname(file.originalname);
        cb(null, `${sku.replace(/[/\\?%*:|"<>]/g, '_')}-${timestamp}${extension}`);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('只允许上传图片文件!'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB
});
// Routes
router.use(adminMiddleware_1.default);
router.get('/products', productController_1.default.getAllProducts);
router.get('/product-options', productController_1.default.getProductOptions);
router.post('/products', upload.single('imageUrl'), productController_1.default.createProduct);
router.put('/products/:id', upload.single('imageUrl'), productController_1.default.updateProduct);
router.delete('/products/:id', productController_1.default.deleteProduct);
// Legacy route for "products-list" used by OnSaleProductsPage
router.get('/products-list', productController_1.default.getProductsWithListings);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map