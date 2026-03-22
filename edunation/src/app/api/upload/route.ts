import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            console.error('[UPLOAD] Unauthorized access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.error('[UPLOAD] No file found in request');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log(`[UPLOAD] Received file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save to public/uploads directory
        const uploadDir = join(process.cwd(), 'public', 'uploads');

        // Ensure directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Directory might already exist
        }

        // Sanitize filename and add timestamp to prevent collisions
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const filename = `${Date.now()}-${safeName}`;
        const filepath = join(uploadDir, filename);

        console.log(`[UPLOAD] Saving to: ${filepath}`);
        await writeFile(filepath, buffer);
        console.log(`[UPLOAD] File saved successfully: ${filename}`);

        // Return the public URL path
        return NextResponse.json({ url: `/uploads/${filename}` });
    } catch (e: any) {
        console.error('[UPLOAD] Critical Error:', e);
        return NextResponse.json({ 
            error: 'Failed to upload file', 
            details: e.message 
        }, { status: 500 });
    }
}
