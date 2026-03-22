
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promote() {
  const email = 'baronjon080@gmail.com';
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'admin' }
  });
  console.log('Successfully promoted to admin:', user.email);
}

promote().catch(console.error).finally(() => prisma.$disconnect());
