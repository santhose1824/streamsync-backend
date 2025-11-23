import prisma from '../prisma';
import crypto from 'crypto';
import { hashPassword, comparePassword } from '../utils/hash';
import { signAccessToken } from '../utils/jwt';

function generateRefreshTokenString() {
  return crypto.randomBytes(48).toString('hex');
}

export async function registerUser({ name, email, password }: {name:string;email:string;password:string}) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw { status: 409, code: 'email_exists', message: 'Email already in use' };

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
  });

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: 'user' });
  const refreshToken = generateRefreshTokenString();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (parseInt(process.env.REFRESH_TOKEN_EXP_DAYS || '30', 10)));

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return { user, accessToken, refreshToken };
}

export async function loginUser({ email, password, ip, userAgent }:{email:string;password:string;ip?:string;userAgent?:string}) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw { status: 401, code: 'invalid_credentials', message: 'Email or password is incorrect' };

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    // optional: record auth_audit with login_failed
    await prisma.authAudit.create({
      data: { userId: user.id, eventType: 'login_failed', ipAddress: ip, userAgent, meta: {} },
    }).catch(()=>{});
    throw { status: 401, code: 'invalid_credentials', message: 'Email or password is incorrect' };
  }

  // success
  await prisma.authAudit.create({
    data: { userId: user.id, eventType: 'login_success', ipAddress: ip, userAgent, meta: {} },
  }).catch(()=>{});

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshTokenString();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (parseInt(process.env.REFRESH_TOKEN_EXP_DAYS || '30', 10)));

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt, userAgent, ipAddress: ip },
  });

  // return public user fields
  const publicUser = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt };

  return { user: publicUser, accessToken, refreshToken };
}

export async function refreshTokens({ refreshToken }:{refreshToken: string}) {
  const row = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!row || row.revokedAt || row.expiresAt <= new Date()) {
    throw { status: 401, code: 'invalid_refresh', message: 'Refresh token invalid or expired' };
  }

  // rotate refresh token
  const newRefresh = generateRefreshTokenString();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (parseInt(process.env.REFRESH_TOKEN_EXP_DAYS || '30', 10)));

  await prisma.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: new Date() },
  });

  const newRow = await prisma.refreshToken.create({
    data: { token: newRefresh, userId: row.userId, expiresAt },
  });

  const user = await prisma.user.findUnique({ where: { id: row.userId } });
  const accessToken = signAccessToken({ sub: user!.id, email: user!.email, role: user!.role });

  return { accessToken, refreshToken: newRefresh };
}

export async function logout({ refreshToken }:{refreshToken:string}) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return { ok: true };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true, deletedAt: true },
  });
  return user;
}

export async function updateUserProfile(userId: string, data: { name?: string; email?: string }) {
  // if email changed, ensure uniqueness
  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== userId) {
      throw { status: 409, code: 'email_exists', message: 'Email already in use' };
    }
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
  });
  return updated;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, code: 'user_not_found', message: 'User not found' };

  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) throw { status: 401, code: 'invalid_current_password', message: 'Current password is incorrect' };

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

  // revoke all refresh tokens for this user
  await prisma.refreshToken.updateMany({ where: { userId }, data: { revokedAt: new Date() } });

  await prisma.authAudit.create({ data: { userId, eventType: 'password_change', meta: {} } }).catch(()=>{});

  return { ok: true };
}

export async function deleteUser(userId: string) {
  // soft delete: set deletedAt
  await prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });

  // revoke refresh tokens
  await prisma.refreshToken.updateMany({ where: { userId }, data: { revokedAt: new Date() } });

  return;
}
