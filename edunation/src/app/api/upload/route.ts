import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Convert file to Buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Create unique filename
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const filename = `${timestamp}-${safeName}`;
        
        const uploadDir = join(process.cwd(), 'public', 'uploads');

        // Ensure directory exists
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const filePath = join(uploadDir, filename);
        await writeFile(filePath, buffer);

        const url = `/uploads/${filename}`;
        return NextResponse.json({ url });
    } catch (error: any) {
        console.error('Upload API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
