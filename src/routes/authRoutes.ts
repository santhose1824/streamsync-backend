import express from 'express';
import * as authController from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);

// protected
router.get('/me', requireAuth, authController.getMe);
router.patch('/me', requireAuth, authController.updateMe);
router.post('/me/change-password', requireAuth, authController.changePassword);
router.delete('/me', requireAuth, authController.deleteMe);

export default router;
