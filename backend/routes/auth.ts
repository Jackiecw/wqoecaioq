import express from 'express';
import authController from '../src/controllers/authController';
import loginRateLimiter from '../loginRateLimiter';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', loginRateLimiter, authController.login);

export default router;
