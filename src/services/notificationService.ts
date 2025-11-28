import prisma from '../prisma';

export async function createNotificationAndEnqueue(
  userId: string,
  title: string,
  body: string,
  metadata?: any,
  idempotencyKey?: string
) {
  // If idempotencyKey provided, try to find existing notification for this user with same key
  if (idempotencyKey) {
    const existing = await prisma.notification.findFirst({
      where: { userId, idempotencyKey },
    });

    if (existing) {
      // Find job if exists
      const job = await prisma.notificationJob.findFirst({
        where: { notificationId: existing.id },
      });
      return { notification: existing, jobId: job?.id ?? null, duplicated: true };
    }
  }

  // Create notification row
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      body,
      metadata,
      idempotencyKey,
    },
  });

  // Create job to enqueue processing by worker
  const job = await prisma.notificationJob.create({
    data: {
      notificationId: notification.id,
      status: 'pending',
    },
  });

  return { notification, jobId: job.id, duplicated: false };
}


export async function listNotifications(userId: string, limit = 20, since?: string) {
  const where: any = { userId, isDeleted: false };
  if (since) where.createdAt = { gt: new Date(since) };
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return notifications;
}

export async function getNotification(userId: string, id: string) {
  return prisma.notification.findFirst({ where: { id, userId, isDeleted: false } });
}

export async function markNotificationsRead(userId: string, ids: string[]) {
  const res = await prisma.notification.updateMany({
    where: { id: { in: ids }, userId },
    data: { isRead: true },
  });
  return res.count;
}

export async function deleteNotification(userId: string, id: string) {
  // soft delete
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { isDeleted: true },
  });
  return;
}
