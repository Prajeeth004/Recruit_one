import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { vapiService } from '@/lib/vapiService';

const callRequestSchema = z.object({
  candidateId: z.string().min(1),
  jobId: z.string().min(1).optional(),
  phoneNumber: z.string().min(1),
  candidateData: z.object({
    name: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional()
  }),
  jobDescription: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug: Call API endpoint hit');
    
    const body = await request.json();
    console.log('📤 Debug: Request body:', body);
    
    // Validate request
    const validatedData = callRequestSchema.parse(body);
    const { candidateId, jobId, phoneNumber, candidateData, jobDescription } = validatedData;
    
    console.log('✅ Debug: Validated data:', { candidateId, jobId, phoneNumber, candidateName: candidateData.name });
    
    // Initiate the call via Vapi
    const callResult = await vapiService.triggerCall({
      phoneNumber,
      candidateData,
      jobDescription,
      candidateId,
      jobId
    });
    
    console.log('📡 Debug: Vapi response:', callResult);
    
    if (callResult.error) {
      console.error('❌ Debug: Call initiation failed:', callResult.error);
      return NextResponse.json(
        { error: 'Failed to initiate call', details: callResult.error },
        { status: 500 }
      );
    }
    
    console.log('✅ Debug: Call initiated successfully:', callResult);
    
    return NextResponse.json({
      success: true,
      callId: callResult.id,
      status: callResult.status,
      message: 'Call initiated successfully'
    });
    
  } catch (error) {
    console.error('❌ Debug: Error in call API:', error);
    
    if (error instanceof z.ZodError) {
      console.log('❌ Debug: Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to initiate call',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Call API endpoint active' });
}
