import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { put } from '@vercel/blob';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const isLocal = req.headers.get('host')?.includes('localhost') || 
                       req.headers.get('host')?.includes('127.0.0.1');
        
        const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

        // Use Vercel Blob if we have a token AND we are not on localhost (unless forced)
        if (blobToken && !isLocal) {
            const blob = await put(file.name, file, {
                access: 'public',
                addRandomSuffix: true,
            });
            return NextResponse.json({ url: blob.url });
        }

        // --- LOCAL FALLBACK (Development) ---
        // if we are here, we are on localhost OR missing a token
        try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const timestamp = Date.now();
            const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
            const filename = `${timestamp}-${safeName}`;
            
            const uploadDir = join(process.cwd(), 'public', 'uploads');

            if (!existsSync(uploadDir)) {
                await mkdir(uploadDir, { recursive: true });
            }

            const filePath = join(uploadDir, filename);
            await writeFile(filePath, buffer);

            const url = `/uploads/${filename}`;
            return NextResponse.json({ url });
        } catch (localErr: any) {
            // If local storage fails (e.g. read-only system) and no blob token is found
            if (!blobToken) {
                return NextResponse.json({ 
                    error: 'Storage not configured. Please enable Vercel Blob in your dashboard.',
                    code: 'STORAGE_UNCONFIGURED'
                }, { status: 500 });
            }
            throw localErr;
        }
    } catch (error: any) {
        console.error('Upload API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
