import { NextRequest, NextResponse } from 'next/server';
import { listCallLogsByCandidate } from '@/lib/serverAppwrite';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ candidateId: string }> }
) {
    try {
        const { candidateId } = await params;
        if (!candidateId) {
            return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 });
        }
        const logs = await listCallLogsByCandidate(candidateId);
        return NextResponse.json({ logs });
    } catch (error: any) {
        console.error('Error fetching call logs:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch call logs' },
            { status: 500 }
        );
    }
}
