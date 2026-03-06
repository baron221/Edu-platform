const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.lesson.findMany({
    where: { OR: [{ muxPlaybackId: { not: null } }, { videoUrl: { not: null } }] },
    select: { id: true, title: true, muxPlaybackId: true, muxAssetId: true, videoUrl: true }
}).then(r => {
    console.log(JSON.stringify(r, null, 2));
}).catch(console.error).finally(() => p.$disconnect());
