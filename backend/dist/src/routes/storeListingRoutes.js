"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const storeListingController_1 = __importDefault(require("../controllers/storeListingController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
// Multer Configuration
const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'listings');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const extension = path_1.default.extname(file.originalname);
        cb(null, `listing-${timestamp}${extension}`);
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
    limits: { fileSize: 1024 * 1024 * 5 }
});
// Routes
router.use(authMiddleware_1.authMiddleware);
router.get('/store-listings', storeListingController_1.default.getStoreListings);
router.post('/store-listings', upload.single('storeImageUrl'), storeListingController_1.default.createListing);
router.get('/store-listings/options', storeListingController_1.default.getListingOptions);
router.get('/store-listings/by-store/:storeId', storeListingController_1.default.getListingsByStore);
router.get('/store-listings/:id', storeListingController_1.default.getListingById);
router.put('/store-listings/:id', upload.single('storeImageUrl'), storeListingController_1.default.updateListing);
router.delete('/store-listings/:id', storeListingController_1.default.deleteListing);
// Price Sync (Moved from products.js)
// Note: The original route was /api/admin/listings/:id in products.js
// We should probably keep the path consistent or update frontend.
// The frontend calls /api/admin/listings/:id.
// If we mount this router at /api/admin, we can add this route here.
router.put('/listings/:id', storeListingController_1.default.syncPrice);
exports.default = router;
//# sourceMappingURL=storeListingRoutes.js.map