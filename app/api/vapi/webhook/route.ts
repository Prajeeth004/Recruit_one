import { NextRequest, NextResponse } from 'next/server';
import { createCallLogRow, updateCallLogRow, getCallLogRowByVapiId } from '@/lib/serverAppwrite';

interface VapiWebhookData {
  message: {
    type: string;
    call?: {
      id: string;
      metadata?: Record<string, any>;
      startedAt?: string;
      endedAt?: string;
      phoneNumber?: { number?: string };
    };
    analysis?: {
      summary: string;
      structuredData: Record<string, any>;
      success?: boolean;
    };
    transcript?: string;
    recordingUrl?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📞 Received Vapi webhook:', JSON.stringify(body, null, 2));

    const message = body.message;

    // Handle call started
    if (message.type === 'status-update' && message.call?.status === 'in-progress') {
      const call = message.call || {};
      const metadata = call.metadata || {};
      try {
        // Find the pending log and update it to in-progress
        const existingLog = await getCallLogRowByVapiId(call.id);
        if (existingLog) {
          await updateCallLogRow(existingLog.$id, {
            status: 'in-progress',
            started_at: call.startedAt || new Date().toISOString(),
          });
          console.log('📝 Updated call log to in-progress:', call.id);
        }
      } catch (dbError) {
        console.error('⚠️ Failed to update call log status:', dbError);
      }
      return NextResponse.json({ status: 'success' });
    }

    // Handle call end and store the full log
    if (message.type === 'end-of-call-report') {
      const analysis = message.analysis || {};
      const call = message.call || {};
      const metadata = call.metadata || {};

      const duration =
        call.startedAt && call.endedAt
          ? Math.floor(
            (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
          )
          : 0;

      console.log('📝 Call completed:', {
        callId: call.id,
        candidateId: metadata.candidateId,
        jobId: metadata.jobId,
        summary: analysis.summary,
        duration,
      });

      try {
        // Try to find an existing pending log and update it
        const existingLog = await getCallLogRowByVapiId(call.id);

        const logData = {
          status: 'completed',
          started_at: call.startedAt || undefined,
          ended_at: call.endedAt || undefined,
          duration,
          notes: analysis.summary || '',
          transcript: message.transcript || '',
          outcome: analysis.structuredData?.outcome || 'unknown',
        };

        if (existingLog) {
          await updateCallLogRow(existingLog.$id, logData);
          console.log('✅ Updated call log for VAPI call:', call.id);
        } else {
          // No existing log found — create a full one from webhook data
          await createCallLogRow({
            vapi_call_id: call.id,
            candidate_id: metadata.candidateId || '',
            job_id: metadata.jobId || '',
            phone_number: metadata.originalPhoneNumber || '',
            direction: 'outbound',
            related_type: 'candidate',
            related_id: metadata.candidateId || '',
            ...logData,
          });
          console.log('✅ Created new call log from webhook for VAPI call:', call.id);
        }
      } catch (dbError) {
        console.error('⚠️ Failed to save call log to Appwrite:', dbError);
        // Still return success so VAPI doesn't retry
      }

      return NextResponse.json({
        status: 'success',
        callId: call.id,
        processed: true,
      });
    }

    return NextResponse.json({ status: 'ignored' });
  } catch (error) {
    console.error('❌ Error processing Vapi webhook:', error);
    return NextResponse.json(
      {
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle Vapi verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'Vapi webhook endpoint active' });
}
