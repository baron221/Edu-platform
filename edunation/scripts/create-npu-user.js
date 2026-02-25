const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const email = '123456@npuu.uz';
    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'NPU Student 123456',
            password: hashedPassword,
            role: 'student',
        },
    });
    console.log('Created test user:', user.email);
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
