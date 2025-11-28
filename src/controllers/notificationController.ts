import { Request, Response, NextFunction } from 'express';
import { sendTestSchema, markReadSchema } from '../validators/notificationsValidator';
import * as notificationService from '../services/notificationService';

export async function sendTest(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = sendTestSchema.parse(req.body);
    const userId = (req as any).userId;
    const { title, body, idempotencyKey } = parsed;

    const result = await notificationService.createNotificationAndEnqueue(
      userId, 
      title, 
      body, 
      undefined, 
      idempotencyKey
    );
    
    // FIXED: Return both notification and job info with proper status code
    return res.status(202).json({ 
      notification: {
        id: result.notification.id,
        title: result.notification.title,
        body: result.notification.body,
        createdAt: result.notification.createdAt,
        isRead: result.notification.isRead,
        sent: result.notification.sent,
      },
      jobId: result.jobId, 
      duplicated: result.duplicated,
      message: result.duplicated 
        ? 'Duplicate notification detected' 
        : 'Notification queued for delivery'
    });
  } catch (err) {
    next(err);
  }
}

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const since = req.query.since as string | undefined;
    const notifications = await notificationService.listNotifications(userId, limit, since);
    
    // Also return unread count for badge
    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    return res.json({ 
      notifications,
      unreadCount,
      total: notifications.length 
    });
  } catch (err) {
    next(err);
  }
}

export async function getNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const id = req.params.id;
    const n = await notificationService.getNotification(userId, id);
    if (!n) {
      return res.status(404).json({ 
        status: 'error', 
        code: 'not_found', 
        message: 'Notification not found' 
      });
    }
    return res.json(n);
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = markReadSchema.parse(req.body);
    const userId = (req as any).userId;
    const count = await notificationService.markNotificationsRead(userId, parsed.ids);
    return res.json({ 
      ok: true, 
      updated: count,
      message: `${count} notification(s) marked as read` 
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const id = req.params.id;
    await notificationService.deleteNotification(userId, id);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}