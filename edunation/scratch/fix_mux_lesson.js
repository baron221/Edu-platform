const { PrismaClient } = require('@prisma/client');
const Mux = require('@mux/mux-node');
require('dotenv').config({ path: '.env.local' });
const prisma = new PrismaClient();

// Mux credentials from env
const { MUX_TOKEN_ID, MUX_TOKEN_SECRET } = process.env;
const mux = new Mux({
  tokenId: MUX_TOKEN_ID,
  tokenSecret: MUX_TOKEN_SECRET,
});

const ASSET_ID = 'TznGRAvaBf6E4v3SV7krbxUnTvuGIYQ6yCwFrYe00sNI';
const LESSON_ID = 'cmoudnhri00012qpqjoe6db1x'; // Previous check confirmed this ID

async function run() {
    try {
        console.log(`Fetching info for Asset ID: ${ASSET_ID}`);
        const asset = await mux.video.assets.retrieve(ASSET_ID);
        
        const playbackId = asset.playback_ids?.[0]?.id;
        const duration = asset.duration;
        
        if (!playbackId) {
            console.error("No Playback ID found for this asset!");
            return;
        }

        console.log(`Found Playback ID: ${playbackId}`);
        console.log(`Duration: ${duration}s`);

        const formattedDuration = new Date(duration * 1000).toISOString().substr(14, 5);

        const updated = await prisma.lesson.update({
            where: { id: LESSON_ID },
            data: {
                muxAssetId: ASSET_ID,
                muxPlaybackId: playbackId,
                videoUrl: `mux:${playbackId}`,
                duration: formattedDuration
            }
        });

        console.log("SUCCESS_UPDATE_START");
        console.log(JSON.stringify(updated, null, 2));
        console.log("SUCCESS_UPDATE_END");

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

run();
