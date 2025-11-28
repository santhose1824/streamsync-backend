import { Request, Response, NextFunction } from 'express';
import { registerFcmSchema, deleteFcmSchema } from '../validators/fcmValidators';
import * as fcmService from '../services/fcmService';

export async function registerFcm(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, platform, meta } = registerFcmSchema.parse(req.body);
    const userIdParam = req.params.userId;
    const authUserId = (req as any).userId;
    if (userIdParam !== authUserId) return res.status(403).json({ status: 'error', code: 'forbidden', message: 'User mismatch' });

    const row = await fcmService.upsertFcmToken(userIdParam, token, platform, meta);
    return res.status(201).json({ ok: true, id: row.id });
  } catch (err) {
    next(err);
  }
}

export async function deleteFcm(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = deleteFcmSchema.parse(req.body);
    const userIdParam = req.params.userId;
    const authUserId = (req as any).userId;
    if (userIdParam !== authUserId) return res.status(403).json({ status: 'error', code: 'forbidden', message: 'User mismatch' });

    const deleted = await fcmService.deleteFcmTokenByToken(userIdParam, parsed.token);
    return res.json({ ok: true, deletedCount: deleted });
  } catch (err) {
    next(err);
  }
}

export async function deleteFcmById(req: Request, res: Response, next: NextFunction) {
  try {
    const userIdParam = req.params.userId;
    const authUserId = (req as any).userId;
    if (userIdParam !== authUserId) return res.status(403).json({ status: 'error', code: 'forbidden', message: 'User mismatch' });

    const id = req.params.id;
    const deleted = await fcmService.deleteFcmTokenById(userIdParam, id);
    if (deleted === 0) return res.status(404).json({ status: 'error', code: 'not_found', message: 'Token not found' });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
