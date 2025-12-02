import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { authMiddleware } from '../middlewares/authMiddleware';
import salesImportController from '../controllers/salesImportController';

const router = express.Router();

// Configure Multer for temporary storage
const upload = multer({ dest: 'uploads/temp/' });

// Ensure temp dir exists
if (!fs.existsSync('uploads/temp/')) {
    fs.mkdirSync('uploads/temp/', { recursive: true });
}

// Apply auth middleware to all routes
router.use(authMiddleware);

// POST /sales-import/preview
router.post('/sales-import/preview', upload.single('file'), salesImportController.preview);

// POST /sales-import/confirm
router.post('/sales-import/confirm', salesImportController.confirm);

// GET /sales-import/batches (Import History)
router.get('/sales-import/batches', salesImportController.getBatches);

// DELETE /sales-import/batch/:id (Rollback)
router.delete('/sales-import/batch/:id', salesImportController.rollback);

export default router;
