import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    const issues = err.issues.map((e: { path: any[]; message: any; }) => ({ path: e.path.join('.'), message: e.message }));
    return res.status(400).json({ status: 'error', code: 'validation_error', message: 'Validation failed', errors: issues });
  }

  if (err && err.status) {
    const status = err.status || 500;
    const code = err.code || 'error';
    const message = err.message || 'Internal error';
    return res.status(status).json({ status: 'error', code, message });
  }

  console.error(err);
  return res.status(500).json({ status: 'error', code: 'internal_error', message: 'Internal server error' });
}
