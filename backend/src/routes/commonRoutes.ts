import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import commonController from '../controllers/commonController';

const router = express.Router();

router.use(authMiddleware);

router.get('/countries', commonController.getCountries);
router.get('/stores', commonController.getStores);
router.get('/exchange-rates', commonController.getExchangeRates);
router.post('/exchange-rates/refresh', commonController.refreshExchangeRates);
router.get('/exchange-rates/refresh-quota', commonController.getRefreshQuota);

export default router;
