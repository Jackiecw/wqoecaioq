import { Router } from 'express';
import { advertisingController } from '../controllers/advertisingController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', advertisingController.getAll);
router.post('/', advertisingController.create);
router.put('/:id', advertisingController.update);
router.delete('/:id', advertisingController.delete);

import { dynamicImportController } from '../controllers/dynamicImportController';
import multer from 'multer';
import fs from 'fs';

const upload = multer({ dest: 'uploads/temp/' });

if (!fs.existsSync('uploads/temp/')) {
    fs.mkdirSync('uploads/temp/', { recursive: true });
}

router.post('/import/preview', upload.single('file'), dynamicImportController.previewAdvertising);
router.post('/import/confirm', dynamicImportController.confirmAdvertising);

export default router;
