import ExamPlayer from '@/components/Exam/ExamPlayer';

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return <ExamPlayer examId={resolvedParams.id} />;
}
