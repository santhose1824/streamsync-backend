import express from 'express';
import * as fcmController from '../controllers/fcmController';
import { requireAuth } from '../middleware/authMiddleware';

const router = express.Router({ mergeParams: true });

// Register token
router.post('/users/:userId/fcm-token', requireAuth, fcmController.registerFcm);

// Delete by token
router.delete('/users/:userId/fcm-token', requireAuth, fcmController.deleteFcm);

// Delete by id
router.delete('/users/:userId/fcm-token/:id', requireAuth, fcmController.deleteFcmById);

export default router;
