
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const course = await prisma.course.findUnique({
    where: { slug: 'front-end-asoslari-6101' },
    include: { lessons: true }
  });
  console.log('Course Lessons:', JSON.stringify(course?.lessons, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
