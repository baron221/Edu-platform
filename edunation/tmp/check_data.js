
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true }
  });
  console.log('All Users and Roles:', users);
  
  const adminCount = users.filter(u => u.role === 'admin').length;
  console.log('Admin Count:', adminCount);

  const pendingPayments = await prisma.manualPayment.findMany({
    where: { status: 'pending' },
    include: { user: { select: { email: true } } }
  });
  console.log('Pending Payments:', pendingPayments);

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { user: { select: { email: true, role: true } } }
  });
  console.log('Recent Notifications:', notifications);
}

check().catch(console.error).finally(() => prisma.$disconnect());
