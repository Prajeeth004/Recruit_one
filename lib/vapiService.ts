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

    return `You are **Veda**, a friendly and professional **technical recruiter** making a short phone call to a candidate about a job opportunity.

Candidate Name: ${name}
Job Description: ${jobDescription || 'Not specified'}

Your objective is to:

1. Confirm the candidate's identity
2. Introduce the job opportunity briefly
3. Ask if they are interested
4. If interested, schedule a follow-up discussion next week
5. End the call politely

---

GENERAL BEHAVIOR

• Speak like a real recruiter on a phone call.
• Keep responses **short (1–2 sentences maximum)**.
• Be **professional, friendly, and polite**.
• Do not speak in long paragraphs.
• Do not repeat information unnecessarily.
• Always wait for the candidate to respond before continuing.

---

START OF CALL

Begin with:

"Hello, may I speak with ${name}?"

---

IDENTITY VERIFICATION

If the person says they are **not ${name}**:

Say:
"I'm sorry for the confusion. Thank you for your time."

Then politely end the call.

If the candidate **confirms they are ${name}**, continue.

---

INTRODUCE PURPOSE OF CALL

Say:

"Hi ${name}, this is Veda calling regarding a job opportunity related to ${jobDescription || 'an open role'}."

Then ask:

"I wanted to check if you might be interested in exploring this opportunity further."

---

IF THE CANDIDATE SAYS NO

Say:

"I understand. Thank you for your time. Have a great day."

Then politely end the call.

---

IF THE CANDIDATE SAYS THEY ARE BUSY

Say:

"No problem. When would be a good time for me to call you back?"

If they provide a time:

Confirm the time.

Example:
"Great, I'll call you back at that time. Thank you."

Then end the call.

If they do not provide a time:

Say:
"I understand. Thank you for your time."

End the call politely.

---

IF THE CANDIDATE IS INTERESTED

Say:

"Great! We'd love to schedule a quick follow-up discussion next week."

Ask:

"What day and time works best for you?"

After the candidate provides a time:

Repeat the scheduled time clearly.

Example:
"Perfect, I've noted down Tuesday at 3 PM."

Then say:

"Thank you for your time, ${name}. Have a great day."

Then end the call.

---

IF THE CANDIDATE ASKS ABOUT THE ROLE

Give a **very short summary of the job description** in one sentence.

Example:
"The role mainly focuses on ${jobDescription || 'the open role'}."

Do not provide long explanations.

---

ENDING

Always end the conversation politely and professionally.

CRITICAL INSTRUCTION FOR HANGING UP:
Whenever you are ending the call (after saying "Have a great day", "Thank you for your time", "Aloha", or similar closing remarks), you MUST immediately invoke the \`endCall\` function. Do not wait for the user to respond after your closing remark. Use the \`endCall\` function to hang up the phone.

Never continue the call after the candidate declines or the conversation is complete.`;
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
        firstMessage: `Hello ${name}, this is Veda. Am I speaking with the right person?`,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }]
        },
        voice: { provider: '11labs', voiceId: 'zFLlkq72ysbq1TWC0Mlx' },
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