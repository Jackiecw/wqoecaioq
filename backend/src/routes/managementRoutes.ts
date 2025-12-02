import express from 'express';
import managementController from '../controllers/managementController';
import adminMiddleware from '../middlewares/adminMiddleware';

const router = express.Router();

router.use(adminMiddleware);

// Options
router.get('/management-options', managementController.getOptions);

// Stores
router.get('/stores', managementController.getAllStores);
router.get('/stores/:id', managementController.getStoreById);
router.post('/stores', managementController.createStore);
router.put('/stores/:id', managementController.updateStore);
router.delete('/stores/:id', managementController.deleteStore);

// Countries
router.get('/countries', managementController.getAllCountries);
router.post('/countries', managementController.createCountry);
router.put('/countries/:id', managementController.updateCountry);

export default router;
