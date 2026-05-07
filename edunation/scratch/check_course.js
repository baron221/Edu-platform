const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const course = await prisma.course.findFirst({
            where: {
                title: {
                    contains: 'Sinfni boshqarish',
                    mode: 'insensitive'
                }
            },
            include: {
                lessons: {
                    orderBy: { order: 'asc' }
                }
            }
        });
        
        if (!course) {
            console.log("Course not found");
            return;
        }
        
        console.log("COURSE_DATA_START");
        console.log(JSON.stringify(course, null, 2));
        console.log("COURSE_DATA_END");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
