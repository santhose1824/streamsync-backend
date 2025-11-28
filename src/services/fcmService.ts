import prisma from '../prisma';

export async function upsertFcmToken(userId: string, token: string, platform?: string, meta?: any) {
  // Try find existing token
  const existing = await prisma.fcmToken.findUnique({ where: { token } });

  if (existing) {
    // If token exists but belongs to another user, reassign it — helpful after restore/restore flows
    if (existing.userId !== userId) {
      return prisma.fcmToken.update({
        where: { id: existing.id },
        data: { userId, platform, createdAt: new Date() },
      });
    }
    // Otherwise update platform/meta and touch createdAt
    return prisma.fcmToken.update({
      where: { id: existing.id },
      data: { platform, createdAt: new Date() },
    });
  }

  // create new
  return prisma.fcmToken.create({
    data: {
      userId,
      token,
      platform,
    },
  });
}

export async function deleteFcmTokenByToken(userId: string, token: string) {
  // delete where token matches and belongs to user
  const res = await prisma.fcmToken.deleteMany({
    where: { token, userId },
  });
  return res.count;
}

export async function deleteFcmTokenById(userId: string, id: string) {
  // ensure token belongs to user before delete
  const row = await prisma.fcmToken.findUnique({ where: { id } });
  if (!row) return 0;
  if (row.userId !== userId) throw { status: 403, code: 'forbidden', message: 'Not allowed' };
  await prisma.fcmToken.delete({ where: { id } });
  return 1;
}

// optional helper: list tokens for a user
export async function listUserFcmTokens(userId: string) {
  return prisma.fcmToken.findMany({ where: { userId } });
}
