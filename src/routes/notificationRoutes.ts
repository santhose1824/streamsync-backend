import express from 'express';
import * as notificationController from '../controllers/notificationController';
import { requireAuth } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/notifications/send-test', requireAuth, notificationController.sendTest);
router.get('/notifications', requireAuth, notificationController.listNotifications);
router.get('/notifications/:id', requireAuth, notificationController.getNotification);
router.post('/notifications/mark-read', requireAuth, notificationController.markRead);
router.delete('/notifications/:id', requireAuth, notificationController.deleteNotification);

export default router;
