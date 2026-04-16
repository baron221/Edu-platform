import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { source_code, language_id = 54, stdin = "" } = await request.json();

        // Check if API key exists
        if (!process.env.JUDGE0_API_KEY) {
            // For development fallback if no key is provided
            // We simulate a basic execution or return a helpful error
            return NextResponse.json({ 
                error: 'Judge0 API Key missing. Please set JUDGE0_API_KEY in environment variables.',
                stdout: 'Compilation failed: API Key Missing',
                status: { id: 6, description: 'Compilation Error' } 
            }, { status: 500 });
        }

        // Submit to Judge0 (Wait=true for synchronous result in small tests)
        const submitRes = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
            method: 'POST',
            headers: {
                'x-rapidapi-key': process.env.JUDGE0_API_KEY,
                'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_code,
                language_id, // 54 is C++ (GCC 9.2.0)
                stdin,
            }),
        });

        const result = await submitRes.json();
        return NextResponse.json(result);

    } catch (error) {
        console.error('[JUDGE0_PROXY_ERROR]', error);
        return NextResponse.json({ error: 'Failed to connect to the code execution engine.' }, { status: 500 });
    }
}
