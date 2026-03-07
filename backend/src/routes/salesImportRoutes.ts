import express from 'express';
import multer from 'multer';
import fs from 'fs';
import salesImportController from '../controllers/salesImportController';
import { requirePermission } from '../middlewares/permissionMiddleware';

const router = express.Router();

// Configure Multer for temporary storage
const upload = multer({ dest: 'uploads/temp/' });

// Ensure temp dir exists
if (!fs.existsSync('uploads/temp/')) {
    fs.mkdirSync('uploads/temp/', { recursive: true });
}

// All import routes require SALES:IMPORT permission
router.post('/sales-import/preview', requirePermission('SALES:IMPORT'), upload.single('file'), salesImportController.preview);
router.post('/sales-import/confirm', requirePermission('SALES:IMPORT'), salesImportController.confirm);
router.get('/sales-import/batches', requirePermission('SALES:IMPORT'), salesImportController.getBatches);
router.delete('/sales-import/batch/:id', requirePermission('SALES:IMPORT'), salesImportController.rollback);

export default router;
