import { NextRequest, NextResponse } from 'next/server';

interface VapiWebhookData {
  message: {
    type: string;
    call?: {
      id: string;
      metadata?: Record<string, any>;
      startedAt?: string;
      endedAt?: string;
    };
    analysis?: {
      summary: string;
      structuredData: Record<string, any>;
      success?: boolean;
    };
    transcript?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📞 Received Vapi webhook:', JSON.stringify(body, null, 2));

    const message = body.message;
    
    if (message.type === 'end-of-call-report') {
      const analysis = message.analysis || {};
      const call = message.call || {};
      const metadata = call.metadata || {};
      
      console.log('📝 Call completed:', {
        callId: call.id,
        candidateId: metadata.candidateId,
        jobId: metadata.jobId,
        summary: analysis.summary,
        duration: call.startedAt && call.endedAt ? 
          Math.floor((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000) : 0
      });
      
      // For now, just log the webhook data
      // You can add database storage later when ready
      return NextResponse.json({ 
        status: 'success',
        callId: call.id,
        processed: true
      });
    }
    
    return NextResponse.json({ status: 'ignored' });
    
  } catch (error) {
    console.error('❌ Error processing Vapi webhook:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle Vapi verification (if needed)
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'Vapi webhook endpoint active' });
}
