/**
 * Prisma Seed Script
 * Run with: npx prisma db seed
 *
 * This seeds the database with initial course and lesson data.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient() as any;

const courseSeedData = [
    {
        slug: 'react-18-mastery',
        title: 'React 18 Mastery: Hooks, Context & Redux',
        description: 'Master React 18 with hooks, context, Redux, and real-world projects. Build 10+ full-stack apps.',
        instructor: 'Alex Johnson',
        category: 'Web Development',
        level: 'Beginner',
        price: 1_130_000,
        isFree: false,
        isNew: false,
        lessons: [
            { title: 'Introduction to React 18', duration: '12:30', order: 1, isFree: true, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Overview of React 18 new features' },
            { title: 'Setting Up Your Environment', duration: '08:45', order: 2, isFree: true, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Node.js, VS Code, and create-react-app' },
            { title: 'JSX Deep Dive', duration: '15:20', order: 3, isFree: false, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Understanding JSX syntax and expressions' },
            { title: 'useState and useEffect', duration: '22:10', order: 4, isFree: false, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Core React hooks explained' },
            { title: 'Custom Hooks', duration: '18:00', order: 5, isFree: false, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Building reusable custom hooks' },
        ],
    },
    {
        slug: 'ui-ux-design-masterclass',
        title: 'UI/UX Design Masterclass: Figma to Code',
        description: 'Learn design thinking, Figma, prototyping, and how to handoff designs to developers.',
        instructor: 'Sarah Chen',
        category: 'Design',
        level: 'Beginner',
        price: 0,
        isFree: true,
        isNew: true,
        lessons: [
            { title: 'Design Thinking Fundamentals', duration: '14:00', order: 1, isFree: true, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Empathy, define, ideate, prototype, test' },
            { title: 'Figma Interface Walkthrough', duration: '20:30', order: 2, isFree: true, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Tools, layers, and components' },
            { title: 'Color Theory & Typography', duration: '16:45', order: 3, isFree: true, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Choosing harmonious color palettes' },
        ],
    },
    {
        slug: 'python-ai-bootcamp',
        title: 'Python & AI Bootcamp: ML to Production',
        description: 'Deep dive into Python, NumPy, Pandas, Scikit-learn, TensorFlow, and build real AI models.',
        instructor: 'Dr. Marcus Webb',
        category: 'Data Science',
        level: 'Intermediate',
        price: 1_510_000,
        isFree: false,
        isNew: false,
        lessons: [
            { title: 'Python for Data Science', duration: '25:00', order: 1, isFree: true, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Python basics for ML practitioners' },
            { title: 'NumPy & Pandas', duration: '30:15', order: 2, isFree: false, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Array operations and DataFrames' },
            { title: 'Your First ML Model', duration: '35:00', order: 3, isFree: false, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Linear regression from scratch' },
        ],
    },
    {
        slug: 'nodejs-api-development',
        title: 'Node.js API Development with Express',
        description: 'Build scalable REST APIs, authenticate users, work with databases, and deploy to production.',
        instructor: 'James Rodriguez',
        category: 'Web Development',
        level: 'Intermediate',
        price: 999_000,
        isFree: false,
        isNew: true,
        lessons: [
            { title: 'Node.js & Express Setup', duration: '10:00', order: 1, isFree: true, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Setting up a Node project' },
            { title: 'REST API Design', duration: '18:30', order: 2, isFree: false, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'CRUD operations and HTTP methods' },
            { title: 'JWT Authentication', duration: '24:00', order: 3, isFree: false, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Securing APIs with JSON Web Tokens' },
        ],
    },
    {
        slug: 'digital-marketing-mastery',
        title: 'Digital Marketing: SEO to Social Media',
        description: 'Master SEO, Google Ads, social media marketing, and analytics to grow any business online.',
        instructor: 'Emma Williams',
        category: 'Marketing',
        level: 'Beginner',
        price: 0,
        isFree: true,
        isNew: false,
        lessons: [
            { title: 'Marketing Fundamentals', duration: '12:00', order: 1, isFree: true, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Understanding the digital marketing landscape' },
            { title: 'SEO Basics', duration: '20:00', order: 2, isFree: true, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'On-page and off-page SEO techniques' },
        ],
    },
    {
        slug: 'nextjs-fullstack',
        title: 'Next.js Full-Stack: App Router & Prisma',
        description: 'Build production-ready full-stack apps with Next.js 14 App Router, Server Components, and Prisma.',
        instructor: 'Yuki Tanaka',
        category: 'Web Development',
        level: 'Advanced',
        price: 1_259_000,
        isFree: false,
        isNew: true,
        lessons: [
            { title: 'Next.js App Router Overview', duration: '15:00', order: 1, isFree: true, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'File-based routing in Next.js 14' },
            { title: 'Server vs Client Components', duration: '22:00', order: 2, isFree: false, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'When to use each component type' },
            { title: 'Prisma + PostgreSQL Setup', duration: '18:00', order: 3, isFree: false, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Database schema and migrations' },
            { title: 'Authentication with NextAuth', duration: '28:00', order: 4, isFree: false, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'OAuth and credential providers' },
        ],
    },
];

async function main() {
    console.log('🌱 Seeding database...');

    // Clear existing data (in order to avoid FK constraint issues)
    await prisma.progress.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.review.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.course.deleteMany();

    for (const data of courseSeedData) {
        const { lessons, ...courseData } = data;

        const course = await prisma.course.create({
            data: {
                ...courseData,
                lessons: {
                    create: lessons,
                },
            },
        });

        console.log(`  ✓ Created course: ${course.title}`);
    }

    console.log(`\n✅ Seeding complete! ${courseSeedData.length} courses created.`);
}

main()
    .catch(e => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
