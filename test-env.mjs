// Test script with dotenv to check environment variables
import dotenv from 'dotenv';
dotenv.config();

console.log('=== Environment Variables Check (with dotenv) ===');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Found' : '❌ Missing');
console.log('NEXT_PUBLIC_GEMINI_API_KEY:', process.env.NEXT_PUBLIC_GEMINI_API_KEY ? '✅ Found' : '❌ Missing');
console.log('QDRANT_URL:', process.env.QDRANT_URL ? '✅ Found' : '❌ Missing');
console.log('QDRANT_API_KEY:', process.env.QDRANT_API_KEY ? '✅ Found' : '❌ Missing');

// Show first few characters of keys to verify they're loaded (without exposing full keys)
if (process.env.GEMINI_API_KEY) {
  console.log('GEMINI_API_KEY starts with:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
}

if (process.env.QDRANT_URL) {
  console.log('QDRANT_URL:', process.env.QDRANT_URL);
}
