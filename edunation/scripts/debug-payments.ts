import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const payments = await (prisma as any).manualPayment.findMany({
            include: { user: true }
        });
        console.log('--- MANUAL PAYMENTS ---');
        payments.forEach((p: any) => {
            console.log(`ID: ${p.id}, Status: [${p.status}], User: ${p.user.email}, Plan: ${p.planId}, Course: ${p.courseId}`);
        });
        console.log('--- END ---');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
