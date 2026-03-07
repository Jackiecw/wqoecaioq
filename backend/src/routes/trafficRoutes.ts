import { Router } from 'express';
import { trafficController } from '../controllers/trafficController';
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
router.get('/', requirePermission('TRAFFIC:VIEW'), trafficController.getAll);

// Write operations
router.post('/', requirePermission('TRAFFIC:MANAGE'), trafficController.create);
router.put('/:id', requirePermission('TRAFFIC:MANAGE'), trafficController.update);
router.delete('/:id', requirePermission('TRAFFIC:MANAGE'), trafficController.delete);

// Import operations
router.post('/import/preview', requirePermission('TRAFFIC:MANAGE'), upload.single('file'), dynamicImportController.previewTraffic);
router.post('/import/confirm', requirePermission('TRAFFIC:MANAGE'), dynamicImportController.confirmTraffic);

export default router;
