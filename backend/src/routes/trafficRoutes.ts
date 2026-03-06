import { Router } from 'express';
import { trafficController } from '../controllers/trafficController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', trafficController.getAll);
router.post('/', trafficController.create);
router.put('/:id', trafficController.update);
router.delete('/:id', trafficController.delete);

import { dynamicImportController } from '../controllers/dynamicImportController';
import multer from 'multer';
import fs from 'fs';

const upload = multer({ dest: 'uploads/temp/' });

if (!fs.existsSync('uploads/temp/')) {
    fs.mkdirSync('uploads/temp/', { recursive: true });
}

router.post('/import/preview', upload.single('file'), dynamicImportController.previewTraffic);
router.post('/import/confirm', dynamicImportController.confirmTraffic);

export default router;
