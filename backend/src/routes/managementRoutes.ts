import express from 'express';
import managementController from '../controllers/managementController';
import { requirePermission } from '../middlewares/permissionMiddleware';

const router = express.Router();

// Options (viewable by anyone with store view access)
router.get('/management-options', requirePermission('ADMIN_STORES:VIEW'), managementController.getOptions);
router.get('/store-platforms', requirePermission('ADMIN_STORES:VIEW'), managementController.getStorePlatforms);

// Stores
router.get('/stores', requirePermission('ADMIN_STORES:VIEW'), managementController.getAllStores);
router.get('/stores/:id', requirePermission('ADMIN_STORES:VIEW'), managementController.getStoreById);
router.post('/stores', requirePermission('ADMIN_STORES:MANAGE'), managementController.createStore);
router.put('/stores/:id', requirePermission('ADMIN_STORES:MANAGE'), managementController.updateStore);
router.delete('/stores/:id', requirePermission('ADMIN_STORES:MANAGE'), managementController.deleteStore);

// Countries
router.get('/countries', requirePermission('ADMIN_COUNTRIES:VIEW'), managementController.getAllCountries);
router.post('/countries', requirePermission('ADMIN_COUNTRIES:MANAGE'), managementController.createCountry);
router.put('/countries/:id', requirePermission('ADMIN_COUNTRIES:MANAGE'), managementController.updateCountry);

export default router;
