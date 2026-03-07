import express from 'express';
import storeListingController from '../controllers/storeListingController';
import { requirePermission } from '../middlewares/permissionMiddleware';
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

// Routes - read operations
router.get('/store-listings', requirePermission('STORE_LISTINGS:VIEW'), storeListingController.getStoreListings);
router.get('/store-listings/options', requirePermission('STORE_LISTINGS:VIEW'), storeListingController.getListingOptions);
router.get('/store-listings/by-store/:storeId', requirePermission('STORE_LISTINGS:VIEW'), storeListingController.getListingsByStore);
router.get('/store-listings/:id', requirePermission('STORE_LISTINGS:VIEW'), storeListingController.getListingById);

// Routes - write operations
router.post('/store-listings', requirePermission('STORE_LISTINGS:MANAGE'), upload.single('storeImageUrl'), storeListingController.createListing);
router.put('/store-listings/:id', requirePermission('STORE_LISTINGS:MANAGE'), upload.single('storeImageUrl'), storeListingController.updateListing);
router.delete('/store-listings/:id', requirePermission('STORE_LISTINGS:MANAGE'), storeListingController.deleteListing);

// Price Sync
router.put('/listings/:id', requirePermission('STORE_LISTINGS:MANAGE'), storeListingController.syncPrice);

// Listing Mappings
router.get('/store-listings/:id/mappings', requirePermission('STORE_LISTINGS:VIEW'), storeListingController.getMappings);
router.post('/store-listings/:id/mappings', requirePermission('STORE_LISTINGS:MANAGE'), storeListingController.createMapping);
router.delete('/store-listings/mappings/:mappingId', requirePermission('STORE_LISTINGS:MANAGE'), storeListingController.deleteMapping);

export default router;
