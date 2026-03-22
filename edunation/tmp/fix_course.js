
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const slug = 'front-end-asoslari-6101';
  const user = await prisma.course.update({
    where: { slug },
    data: { published: true, category: 'Web Development' }
  });
  console.log('Successfully published & categorized:', user.title);
}

fix().catch(console.error).finally(() => prisma.$disconnect());
