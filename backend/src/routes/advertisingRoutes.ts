import { Router } from 'express';
import { advertisingController } from '../controllers/advertisingController';
import { requirePermission } from '../middlewares/permissionMiddleware';
import { dynamicImportController } from '../controllers/dynamicImportController';
import multer from 'multer';
import fs from 'fs';

const router = Router();

const upload = multer({ dest: 'uploads/temp/' });

if (!fs.existsSync('uploads/temp/')) {
    fs.mkdirSync('uploads/temp/', { recursive: true });
}

// Read operations
router.get('/', requirePermission('ADVERTISING:VIEW'), advertisingController.getAll);

// Write operations
router.post('/', requirePermission('ADVERTISING:MANAGE'), advertisingController.create);
router.put('/:id', requirePermission('ADVERTISING:MANAGE'), advertisingController.update);
router.delete('/:id', requirePermission('ADVERTISING:MANAGE'), advertisingController.delete);

// Import operations
router.post('/import/preview', requirePermission('ADVERTISING:MANAGE'), upload.single('file'), dynamicImportController.previewAdvertising);
router.post('/import/confirm', requirePermission('ADVERTISING:MANAGE'), dynamicImportController.confirmAdvertising);

export default router;
