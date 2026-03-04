/**
 * One-time migration script: replaces deprecated source.unsplash.com thumbnail
 * URLs in the database with reliable picsum.photos equivalents.
 *
 * Run with: node scripts/fix-unsplash-thumbnails.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const courses = await prisma.course.findMany({
        where: { thumbnail: { contains: 'source.unsplash.com' } },
        select: { id: true, title: true, thumbnail: true },
    });

    console.log(`Found ${courses.length} courses with broken unsplash thumbnails`);

    for (const course of courses) {
        // Use the course ID as a stable seed so the same image is always shown
        const newThumb = `https://picsum.photos/seed/${course.id}/800/600`;
        await prisma.course.update({
            where: { id: course.id },
            data: { thumbnail: newThumb },
        });
        console.log(`  ✓ Fixed: "${course.title}" → ${newThumb}`);
    }

    console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
