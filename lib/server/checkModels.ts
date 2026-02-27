import { GoogleGenAI } from '@google/genai';

async function checkAvailableModels() {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    console.log('❌ No Gemini API key found');
    return;
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  // Try common model names to see what works
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest', 
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest',
    'gemini-pro',
    'gemini-pro-latest',
    'gemini-1.0-pro',
    'gemini-2.0-flash',
    'gemini-2.0-pro',
    'text-bison-001',
    'chat-bison-001'
  ];

  console.log('🔍 Testing model availability...');
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`Testing ${modelName}...`);
      const result = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts: [{ text: 'Hello' }] }]
      });
      console.log(`✅ ${modelName} - WORKS`);
      break; // Stop at first working model
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`❌ ${modelName} - NOT FOUND`);
      } else {
        console.log(`⚠️ ${modelName} - ERROR: ${error.message}`);
      }
    }
  }
}

// Run the check
checkAvailableModels();
