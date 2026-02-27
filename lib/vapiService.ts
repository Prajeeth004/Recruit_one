import { NextRequest } from 'next/server';

interface CandidateData {
  name: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

interface CallOptions {
  phoneNumber: string;
  candidateData: CandidateData;
  jobDescription?: string;
  candidateId?: string;
  jobId?: string;
}

interface VapiCallResponse {
  id?: string;
  status?: string;
  error?: string;
}

class VapiService {
  private apiKey: string;
  private phoneId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.VAPI_API_KEY || '';
    this.phoneId = process.env.VAPI_PHONE_NUMBER_ID || '';
    this.baseUrl = 'https://api.vapi.ai/call/phone';
    
    if (!this.apiKey || !this.phoneId) {
      console.warn('Vapi API credentials not found in environment variables');
    }
  }

  private buildSystemPrompt(candidateData: CandidateData, jobDescription?: string): string {
    const name = candidateData.name || `${candidateData.firstName || ''} ${candidateData.lastName || ''}`.trim();
    
    return `You are Asteria, a technical recruiter. 
Job Description: ${jobDescription || 'Not specified'}
Candidate Name: ${name}

Goal: 
1. Confirm you are speaking with ${name}.
2. Briefly mention the role based on the JD.
3. Verify if they are interested and check availability for a follow-up next week.
4. If they say YES, ask: 'What day and time works best for you?'.

Style: Professional, friendly, and concise. End by saying 'Aloha'.`;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If already in E.164 format (starts with +), return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // If starts with 00 (international format), replace with +
    if (phoneNumber.startsWith('00')) {
      return '+' + phoneNumber.substring(2);
    }
    
    // Add default country code (India: +91) for 10-digit numbers
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    
    // For other cases, add + prefix
    return '+' + cleaned;
  }

  async triggerCall(options: CallOptions): Promise<VapiCallResponse> {
    console.log('🔍 Debug: VapiService.triggerCall called with:', options);
    
    if (!this.apiKey || !this.phoneId) {
      console.log('❌ Debug: Vapi credentials missing:', {
        hasApiKey: !!this.apiKey,
        hasPhoneId: !!this.phoneId
      });
      return { error: 'Vapi API credentials not configured' };
    }

    const { phoneNumber, candidateData, jobDescription, candidateId, jobId } = options;
    const name = candidateData.name || `${candidateData.firstName || ''} ${candidateData.lastName || ''}`.trim();
    
    // Format phone number to E.164
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    console.log('📞 Debug: Phone number formatting:', {
      original: phoneNumber,
      formatted: formattedPhone
    });

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    const systemPrompt = this.buildSystemPrompt(candidateData, jobDescription);
    console.log('📝 Debug: Generated system prompt:', systemPrompt);

    const payload = {
      phoneNumberId: this.phoneId,
      customer: {
        number: formattedPhone,
        name: name
      },
      assistant: {
        firstMessage: `Hello ${name}, this is Asteria. Am I speaking with the right person?`,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }]
        },
        voice: { provider: 'deepgram', voiceId: 'asteria' },
        serverUrl: `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/api/vapi/webhook`,
        endCallFunctionEnabled: true,
        // Store metadata for webhook processing
        metadata: {
          candidateId: candidateId || candidateData.phone,
          jobId: jobId,
          candidateName: name,
          jobDescription: jobDescription,
          originalPhoneNumber: phoneNumber
        }
      }
    };

    console.log('📤 Debug: Vapi API payload:', payload);

    try {
      console.log(`📞 Debug: Attempting to call ${formattedPhone}...`);
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      console.log('📡 Debug: Vapi API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Debug: Vapi API error response:', errorText);
        throw new Error(`Vapi API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Debug: Vapi API success response:', data);
      return data;
    } catch (error) {
      console.error('❌ Debug: Vapi API Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const vapiService = new VapiService();
export type { CallOptions, VapiCallResponse, CandidateData };
