// Test script to check environment variables
console.log('=== Environment Variables Check ===');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Found' : '❌ Missing');
console.log('NEXT_PUBLIC_GEMINI_API_KEY:', process.env.NEXT_PUBLIC_GEMINI_API_KEY ? '✅ Found' : '❌ Missing');
console.log('QDRANT_URL:', process.env.QDRANT_URL ? '✅ Found' : '❌ Missing');
console.log('QDRANT_API_KEY:', process.env.QDRANT_API_KEY ? '✅ Found' : '❌ Missing');

// Test embedding creation
import { GoogleGenAI } from '@google/genai';

async function testEmbedding() {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  console.log('\n=== Embedding Test ===');
  console.log('API Key available:', !!key);
  
  if (key) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      console.log('✅ GoogleGenAI client created successfully');
      
      const res = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: [{ parts: [{ text: 'test embedding' }] }],
        config: { outputDimensionality: 1536 },
      });
      
      const vec = res.embeddings?.[0]?.values;
      console.log('✅ Embedding test successful, vector length:', vec?.length || 'null');
    } catch (error) {
      console.error('❌ Embedding test failed:', error.message);
    }
  }
}

testEmbedding();
