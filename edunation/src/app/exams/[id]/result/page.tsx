import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ExamResultPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/login');

    const { id: examId } = await params;
    const userId = (session.user as any).id;

    const attempt = await prisma.examAttempt.findUnique({
        where: { userId_examId: { userId, examId } },
        include: { exam: true }
    });

    if (!attempt) {
        redirect(`/exams/${examId}`);
    }

    // If still in progress, they shouldn't see the result
    if (attempt.status === 'IN_PROGRESS') {
        redirect(`/exams/${examId}`);
    }

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#f8fafc', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{ 
                maxWidth: '600px', 
                width: '100%',
                background: '#fff', 
                padding: '48px', 
                borderRadius: '24px', 
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎯</div>
                <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Exam Finished</h1>
                <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '40px' }}>{attempt.exam.title}</p>
                
                <div style={{ 
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
                    padding: '32px', 
                    borderRadius: '20px', 
                    marginBottom: '40px',
                    border: '1px solid #bae6fd'
                }}>
                    <div style={{ fontSize: '12px', color: '#0369a1', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>
                        Current Score
                    </div>
                    <div style={{ fontSize: '56px', fontWeight: 900, color: '#0284c7' }}>
                        {attempt.score} <span style={{ fontSize: '20px', fontWeight: 600 }}>pts</span>
                    </div>
                    <div style={{ marginTop: '16px', fontSize: '14px', color: '#0c4a6e', lineHeight: 1.6, maxWidth: '300px', margin: '16px auto 0' }}>
                        MCQ scores are calculated. Coding problems are pending instructor review.
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Link href="/courses" style={{ 
                        background: '#0f172a', 
                        color: '#fff', 
                        padding: '16px', 
                        borderRadius: '12px', 
                        textDecoration: 'none', 
                        fontWeight: 700,
                        transition: 'opacity 0.2s'
                    }}>
                        Back to Courses
                    </Link>
                </div>
            </div>
        </div>
    );
}
