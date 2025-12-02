import express from 'express';
import storeListingController from '../controllers/storeListingController';
import { authMiddleware } from '../middlewares/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Multer Configuration
const uploadDir = path.join(process.cwd(), 'uploads', 'listings');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        cb(null, `listing-${timestamp}${extension}`);
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
    limits: { fileSize: 1024 * 1024 * 5 }
});

// Routes
router.use(authMiddleware);

router.get('/store-listings', storeListingController.getStoreListings);
router.post('/store-listings', upload.single('storeImageUrl'), storeListingController.createListing);
router.get('/store-listings/options', storeListingController.getListingOptions);
router.get('/store-listings/by-store/:storeId', storeListingController.getListingsByStore);
router.get('/store-listings/:id', storeListingController.getListingById);
router.put('/store-listings/:id', upload.single('storeImageUrl'), storeListingController.updateListing);
router.delete('/store-listings/:id', storeListingController.deleteListing);

// Price Sync (Moved from products.js)
// Note: The original route was /api/admin/listings/:id in products.js
// We should probably keep the path consistent or update frontend.
// The frontend calls /api/admin/listings/:id.
// If we mount this router at /api/admin, we can add this route here.
router.put('/listings/:id', storeListingController.syncPrice);

export default router;
