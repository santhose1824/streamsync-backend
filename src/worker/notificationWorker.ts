import dotenv from 'dotenv';
dotenv.config();

import prisma from '../prisma';
import admin from 'firebase-admin';
import fs from 'fs';

// Initialize Firebase Admin if service account present
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (fs.existsSync(keyPath)) {
    const serviceAccount = require(keyPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('Firebase admin initialized');
  } else {
    console.warn('FIREBASE_SERVICE_ACCOUNT_PATH set but file not found:', keyPath);
  }
} else {
  console.warn('FIREBASE_SERVICE_ACCOUNT_PATH not set - worker will not send real pushes');
}

async function processOneJob() {
  // claim one pending job
  const job = await prisma.notificationJob.findFirst({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
  });

  if (!job) {
    return false;
  }

  try {
    await prisma.notificationJob.update({ 
      where: { id: job.id }, 
      data: { status: 'processing', processingAt: new Date() } 
    });

    // load notification
    const notification = await prisma.notification.findUnique({ 
      where: { id: job.notificationId } 
    });
    
    if (!notification) {
      await prisma.notificationJob.update({ 
        where: { id: job.id }, 
        data: { status: 'failed', lastError: 'Notification missing' } 
      });
      return true;
    }

    // find all fcm tokens for the user
    const tokens = await prisma.fcmToken.findMany({ 
      where: { userId: notification.userId } 
    });
    const registrationTokens = tokens.map(t => t.token);

    if (registrationTokens.length === 0) {
      // mark job as sent but nothing to send
      await prisma.notificationJob.update({ 
        where: { id: job.id }, 
        data: { status: 'sent', sentAt: new Date() } 
      });
      await prisma.notification.update({ 
        where: { id: notification.id }, 
        data: { sent: false } 
      });
      console.log('No FCM tokens found for user:', notification.userId);
      return true;
    }

    // If firebase-admin initialized, send; otherwise log
    if (admin.apps.length > 0) {
      // FIXED: Use sendEachForMulticast instead of deprecated sendToDevice
      // In processOneJob() function, around line 65

const message = {
  notification: {
    title: notification.title,
    body: notification.body,
  },
  data: {
    id: notification.id,  // ✅ ADD THIS - so Flutter knows which notification it is
    notificationId: notification.id,  // ✅ ADD THIS - alternative field name
    ...notification.metadata 
      ? Object.fromEntries(
          Object.entries(notification.metadata).map(([k, v]) => [k, String(v)])
        )
      : {},
  },
  tokens: registrationTokens,
};

      try {
        const resp = await admin.messaging().sendEachForMulticast(message);
        
        console.log(`Sent notification ${notification.id}: ${resp.successCount} success, ${resp.failureCount} failed`);
        
        // Handle failed tokens
        if (resp.failureCount > 0) {
          resp.responses.forEach((result, idx) => {
            if (!result.success) {
              const token = registrationTokens[idx];
              const errorCode = result.error?.code;
              
              console.log(`Failed to send to token ${token}: ${errorCode}`);
              
              // Remove invalid tokens
              if (
                errorCode === 'messaging/registration-token-not-registered' ||
                errorCode === 'messaging/invalid-registration-token' ||
                errorCode === 'messaging/invalid-argument'
              ) {
                prisma.fcmToken.deleteMany({ where: { token } })
                  .then(() => console.log(`Removed invalid token: ${token}`))
                  .catch(err => console.error('Error removing token:', err));
              }
            }
          });
        }

        // Mark as sent if at least one succeeded
        const wasSent = resp.successCount > 0;
        await prisma.notificationJob.update({ 
          where: { id: job.id }, 
          data: { status: 'sent', sentAt: new Date() } 
        });
        await prisma.notification.update({ 
          where: { id: notification.id }, 
          data: { sent: wasSent } 
        });

      } catch (sendErr: any) {
        console.error('Firebase send error:', sendErr);
        throw sendErr;
      }
    } else {
      // not configured: just log and mark as sent (development mode)
      console.log('DEV MODE: Would send notification to', registrationTokens.length, 'devices');
      console.log('Title:', notification.title);
      console.log('Body:', notification.body);
      
      await prisma.notificationJob.update({ 
        where: { id: job.id }, 
        data: { status: 'sent', sentAt: new Date() } 
      });
      await prisma.notification.update({ 
        where: { id: notification.id }, 
        data: { sent: true } 
      });
    }
  } catch (err: any) {
    console.error('Worker: job error', err);
    // increment retries
    await prisma.notificationJob.update({
      where: { id: job.id },
      data: { 
        status: 'failed', 
        lastError: String(err?.message || err), 
        retries: { increment: 1 } 
      },
    });
  }
  return true;
}

async function loop() {
  console.log('Notification worker started...');
  while (true) {
    const didWork = await processOneJob();
    if (!didWork) {
      await new Promise(r => setTimeout(r, 2000)); // sleep when no jobs
    }
  }
}

loop().catch(err => {
  console.error('Worker crashed', err);
  process.exit(1);
});