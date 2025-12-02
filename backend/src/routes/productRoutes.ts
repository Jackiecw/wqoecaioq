import express from 'express';
import productController from '../controllers/productController';
import adminMiddleware from '../middlewares/adminMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Multer Configuration
const uploadDir = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const sku = req.body.sku || 'temp';
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        cb(null, `${sku.replace(/[/\\?%*:|"<>]/g, '_')}-${timestamp}${extension}`);
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('只允许上传图片文件!'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB
});

// Routes
router.use(adminMiddleware);

router.get('/products', productController.getAllProducts);
router.get('/product-options', productController.getProductOptions);
router.post('/products', upload.single('imageUrl'), productController.createProduct);
router.put('/products/:id', upload.single('imageUrl'), productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// Legacy route for "products-list" used by OnSaleProductsPage
router.get('/products-list', productController.getProductsWithListings);

export default router;
