import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { registerSchema, loginSchema, refreshSchema, updateProfileSchema, changePasswordSchema } from '../validators/authValidators';
import { z } from 'zod';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerSchema.parse(req.body);
    const result = await authService.registerUser(parsed);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.parse(req.body);
    const ip = req.ip;
    const userAgent = req.get('User-Agent') || undefined;
    const result = await authService.loginUser({ ...parsed, ip, userAgent });
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = refreshSchema.parse(req.body);
    const result = await authService.refreshTokens(parsed);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = refreshSchema.parse(req.body);
    await authService.logout(parsed);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const user = await authService.getUserById(userId);
    return res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    
    const parsed = updateProfileSchema.parse(req.body);
  
    const userId = (req as any).userId;
    
    const updated = await authService.updateUserProfile(userId, parsed);
    
    return res.json(updated);
  } catch (err) {
    console.error('6. Error occurred:', err);
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = changePasswordSchema.parse(req.body);
    const userId = (req as any).userId;
    await authService.changePassword(userId, parsed.currentPassword, parsed.newPassword);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function deleteMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    await authService.deleteUser(userId);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}
