
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('Recent Courses:', JSON.stringify(courses, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
