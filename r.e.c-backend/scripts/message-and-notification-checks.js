// Script to validate messaging and notifications flows using Prisma directly
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function ensureUser(role, prefix) {
  const ts = Date.now();
  const hashed = await bcrypt.hash('password123', 10);
  return prisma.user.create({
    data: {
      nombres: `${prefix} ${role}`,
      apellidos: 'Usuario',
      email: `${prefix}_${role}_${ts}@example.com`,
      password: hashed,
      role,
    },
  });
}

async function main() {
  // Create sender and recipient (students for simplicity)
  const sender = await ensureUser('ESTUDIANTE', 'sender');
  const recipient = await ensureUser('ESTUDIANTE', 'recipient');

  // Create message
  const message = await prisma.message.create({
    data: {
      senderId: sender.id,
      recipientId: recipient.id,
      content: 'Hola, este es un mensaje de prueba.',
    },
  });

  // Inbox and sent
  const inbox = await prisma.message.findMany({ where: { recipientId: recipient.id }, orderBy: { createdAt: 'desc' } });
  const sent = await prisma.message.findMany({ where: { senderId: sender.id }, orderBy: { createdAt: 'desc' } });

  // Mark read
  const read = await prisma.message.update({ where: { id: message.id }, data: { readAt: new Date() } });

  // Notifications
  const notif = await prisma.notification.create({
    data: {
      userId: recipient.id,
      title: 'Aviso General',
      body: 'Notificación de prueba',
      type: 'GENERAL',
    },
  });
  const notifs = await prisma.notification.findMany({ where: { userId: recipient.id }, orderBy: { createdAt: 'desc' } });
  const notifRead = await prisma.notification.update({ where: { id: notif.id }, data: { readAt: new Date() } });

  console.log('Messaging & Notification checks:', {
    senderId: sender.id,
    recipientId: recipient.id,
    createdMessageId: message.id,
    inboxCount: inbox.length,
    sentCount: sent.length,
    messageReadAt: read.readAt,
    createdNotificationId: notif.id,
    notificationsCount: notifs.length,
    notificationReadAt: notifRead.readAt,
  });
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });