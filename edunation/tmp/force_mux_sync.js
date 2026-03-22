
const { PrismaClient } = require('@prisma/client');
const Mux = require('@mux/mux-node');
require('dotenv').config();

const prisma = new PrismaClient();
const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

async function sync() {
  const lessonId = 'cmn204ebx000g3b49ztkf6bg5';
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  
  if (!lesson || !lesson.videoUrl?.startsWith('mux-upload:')) {
    console.log('No stuck upload found for this ID.');
    return;
  }
  
  const uploadId = lesson.videoUrl.split(':')[1];
  console.log('Checking Mux Upload ID:', uploadId);
  
  const upload = await mux.video.uploads.retrieve(uploadId);
  console.log('Upload Status:', upload.status);
  
  if (upload.status === 'asset_created' && upload.asset_id) {
    const asset = await mux.video.assets.retrieve(upload.asset_id);
    const playbackId = asset.playback_ids?.[0]?.id;
    
    if (playbackId) {
      await prisma.lesson.update({
        where: { id: lessonId },
        data: {
          muxAssetId: asset.id,
          muxPlaybackId: playbackId,
          videoUrl: `mux:${playbackId}`
        }
      });
      console.log('Successfully synced video! Playback ID:', playbackId);
    } else {
      console.log('Asset created but no playback ID found yet.');
    }
  } else {
    console.log('Upload is not ready yet or errored.');
  }
}

sync().catch(console.error).finally(() => prisma.$disconnect());
