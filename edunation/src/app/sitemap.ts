import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://edunationuz.com';

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${baseUrl}/courses`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
        { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ];

    // Dynamic course pages
    let coursePages: MetadataRoute.Sitemap = [];
    try {
        const courses = await prisma.course.findMany({
            where: { published: true },
            select: { slug: true, updatedAt: true },
        });

        coursePages = courses.map((course) => ({
            url: `${baseUrl}/courses/${course.slug}`,
            lastModified: course.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));
    } catch (error) {
        console.error('Sitemap: could not fetch courses', error);
    }

    return [...staticPages, ...coursePages];
}
