
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('Courses:', JSON.stringify(courses, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
