import { prisma } from "@/lib/prisma";

// Placeholder for Email Service Integration (e.g., SendGrid, AWS SES)
async function sendEmailNotification(userId: string, subject: string, message: string) {
  // TODO: Fetch user email from DB and send email via provider
  // const user = await prisma.user.findUnique({ where: { id: userId } });
  // await emailProvider.send({ to: user.email, subject, html: message });
  console.log(`[MOCK EMAIL] To User ${userId}: ${subject} - ${message}`);
}

// Placeholder for Push Notification Service (e.g., Firebase FCM, OneSignal)
async function sendPushNotification(userId: string, title: string, body: string) {
  // TODO: Fetch user device tokens and send push notification
  // const tokens = await prisma.deviceToken.findMany({ where: { userId } });
  // await pushProvider.send({ tokens, title, body });
  console.log(`[MOCK PUSH] To User ${userId}: ${title} - ${body}`);
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    // 1. In-App Notification (Database)
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
      },
    });

    // 2. Trigger External Notifications (Non-blocking)
    // In production, these might be queued (e.g., Redis/BullMQ) to avoid slowing down the request
    Promise.allSettled([
      sendEmailNotification(userId, title, message),
      sendPushNotification(userId, title, message),
    ]);

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    // Depending on criticality, we might want to rethrow or just log
  }
}
