
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const course = await prisma.course.findUnique({
    where: { slug: 'zamonaviy-frontend-dasturlash-kursi' },
    include: { lessons: true }
  });
  console.log('Course ID:', course?.id);
  console.log('Lessons:', JSON.stringify(course?.lessons, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
