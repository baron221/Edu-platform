
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const course = await prisma.course.findUnique({
    where: { slug: 'zamonaviy-frontend-dasturlash-kursi' },
    include: { lessons: true }
  });
  
  course.lessons.forEach(l => {
    if (l.videoUrl?.startsWith('mux-upload:')) {
      console.log('STUCK LESSON:', {
        id: l.id,
        title: l.title,
        videoUrl: l.videoUrl
      });
    }
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());
