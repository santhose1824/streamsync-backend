import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET: string | undefined = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 10) {
  console.error('FATAL: JWT_SECRET is missing or too short. Set JWT_SECRET in .env and restart.');
}

const ACCESS_EXP = process.env.ACCESS_TOKEN_EXP || '15m';

// synchronous, returns a string (not a Promise)
export function signAccessToken(payload: object): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET missing');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXP as any });
}

// verify returns decoded payload or throws
export function verifyAccessToken(token: string) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET missing');
  return jwt.verify(token, JWT_SECRET) as any;
}
