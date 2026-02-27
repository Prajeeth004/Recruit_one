# Vapi AI Integration Guide

## Overview
This integration allows you to call candidates directly from the recruitment platform using Vapi AI. The system will:
1. Initiate calls to candidates using AI-powered conversations
2. Store call logs and transcripts automatically
3. Update candidate records with call outcomes

## Setup Instructions

### 1. Environment Variables
Add these to your `.env` file:

```env
# Vapi AI Configuration
VAPI_API_KEY=your_vapi_api_key
VAPI_PHONE_NUMBER_ID=your_vapi_phone_number_id

# Optional: If different from your main Appwrite config
VAPI_WEBHOOK_URL=https://your-domain.com/api/vapi/webhook
```

### 2. Vapi AI Setup
1. Sign up for Vapi AI at https://vapi.ai
2. Get your API key from the dashboard
3. Create a phone number and get its ID
4. Configure your assistant settings in Vapi dashboard

### 3. Webhook Configuration
Set your Vapi webhook URL to:
```
https://your-domain.com/api/vapi/webhook
```

## How It Works

### Call Flow
1. **Initiation**: Click "Call Candidate" in the job candidates table
2. **AI Call**: Vapi AI calls the candidate with a customized script
3. **Conversation**: AI discusses the job and candidate availability
4. **Completion**: Call ends and webhook sends results
5. **Logging**: Call details are stored in the call_logs table

### API Endpoints

#### POST /api/call
Initiates a call to a candidate.

**Request Body:**
```json
{
  "candidateId": "candidate_123",
  "jobId": "job_456", 
  "phoneNumber": "+1234567890",
  "candidateData": {
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "jobDescription": "Software Engineer position"
}
```

#### POST /api/vapi/webhook
Receives webhook data from Vapi after call completion.

**Webhook Data:**
```json
{
  "message": {
    "type": "end-of-call-report",
    "call": { "id": "call_123" },
    "analysis": {
      "summary": "Candidate is interested and available next week",
      "structuredData": { "outcome": "interested" }
    },
    "transcript": "Full call transcript here..."
  }
}
```

## Database Schema

### call_logs Table
The system uses the existing `call_logs` table with these fields:
- `phone_number`: Candidate's phone number
- `direction`: Always "outbound" for Vapi calls
- `status`: Call completion status
- `started_at` / `ended_at`: Call timestamps
- `duration`: Call duration in seconds
- `outcome`: Call result (interested, not_interested, etc.)
- `notes`: AI-generated summary
- `related_type`: Always "candidate"
- `related_id`: Candidate's ID

## UI Integration

### Job Candidates Table
- **Call Button**: In the actions dropdown menu
- **Loading State**: Shows "Calling..." while initiating
- **Toast Notifications**: Success/error feedback

### Call Script
The AI assistant (Asteria) follows this script:
1. Confirms speaking with the candidate
2. Briefly mentions the role
3. Checks interest and availability
4. Asks for preferred follow-up time
5. Ends with "Aloha"

## Features

### ✅ Implemented
- [x] Call initiation from candidate table
- [x] AI-powered conversations
- [x] Call log storage
- [x] Webhook processing
- [x] Error handling and notifications

### 🚧 Future Enhancements
- [ ] Call recordings
- [ ] Custom call scripts per job
- [ ] Bulk calling (multiple candidates)
- [ ] Call scheduling
- [ ] SMS follow-ups
- [ ] Call analytics dashboard

## Troubleshooting

### Common Issues

1. **"Vapi API credentials not configured"**
   - Check environment variables are set correctly
   - Verify API key and phone ID are valid

2. **"Candidate phone number not available"**
   - Ensure candidate records have phone numbers
   - Check phone number format includes country code

3. **Webhook not receiving data**
   - Verify webhook URL is accessible
   - Check Vapi dashboard webhook configuration
   - Ensure HTTPS is used (required for webhooks)

4. **Call logs not appearing**
   - Check Appwrite database permissions
   - Verify webhook is being called successfully
   - Check server logs for errors

### Debugging
- Check browser console for frontend errors
- Monitor server logs for API issues
- Use Vapi dashboard to track call status
- Verify Appwrite database records

## Security Considerations

- API keys are stored in environment variables
- Webhook endpoints validate incoming data
- Call logs have appropriate permissions
- Phone numbers are validated before calling

## Support

For issues with:
- **Vapi AI**: Contact Vapi support
- **Integration**: Check this guide and logs
- **Database**: Verify Appwrite setup
- **Frontend**: Check browser console errors
