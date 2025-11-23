import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import prisma from '../prisma';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ status: 'error', code: 'no_token', message: 'Missing Authorization header' });

    const token = auth.replace('Bearer ', '');
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({ status: 'error', code: 'invalid_token', message: 'Invalid access token' });
    }
    const userId = (await decoded).sub as string;
    // fetch user to ensure exists and not deleted
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true, deletedAt: true } });
    if (!user || user.deletedAt) return res.status(401).json({ status: 'error', code: 'user_not_found', message: 'User not found or deleted' });

    (req as any).userId = user.id;
    (req as any).user = user;
    next();
  } catch (err) {
    next(err);
  }
}
