// Quick test to create sample embeddings manually
import dotenv from 'dotenv';
dotenv.config();

import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenAI } from '@google/genai';

async function createSampleEmbeddings() {
  console.log('🧪 Creating sample embeddings for testing...');
  
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!url || !apiKey || !geminiKey) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  const qdrant = new QdrantClient({ url, apiKey });
  const ai = new GoogleGenAI({ apiKey: geminiKey });
  
  try {
    // Clear and recreate collection
    try {
      await qdrant.deleteCollection('candidate_embeddings');
    } catch {}
    
    await qdrant.createCollection('candidate_embeddings', {
      vectors: { size: 1536, distance: 'Cosine' }
    });
    console.log('✅ Collection created');
    
    // Create sample candidates with your actual IDs
    const sampleCandidates = [
      {
        id: '69943df6000c778be61b',
        title: 'Python Developer',
        skills: 'Python, Java, React, Machine Learning',
        text: 'Python Developer with skills in Python, Java, React, Machine Learning'
      },
      {
        id: '6994398b000474a6a3bb', 
        title: 'Full Stack Developer',
        skills: 'Java, Python, SQL, Machine Learning',
        text: 'Full Stack Developer with skills in Java, Python, SQL, Machine Learning'
      },
      {
        id: '69957d600011dd94d181',
        title: 'ML Engineer',
        skills: 'Python, Java, Machine Learning, CNNs',
        text: 'ML Engineer with skills in Python, Java, Machine Learning, CNNs'
      }
    ];
    
    for (const candidate of sampleCandidates) {
      try {
        console.log(`🔍 Creating embedding for ${candidate.id}...`);
        
        const res = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: [{ parts: [{ text: candidate.text }] }],
          config: { outputDimensionality: 1536 },
        });
        
        const vector = res.embeddings?.[0]?.values;
        if (!vector || vector.length !== 1536) {
          console.error(`❌ Invalid embedding for ${candidate.id}`);
          continue;
        }
        
        await qdrant.upsert('candidate_embeddings', {
          points: [{
            id: candidate.id,
            vector: vector,
            payload: {
              candidate_id: candidate.id,
              title: candidate.title,
              skills: candidate.skills
            }
          }]
        });
        
        console.log(`✅ Stored embedding for ${candidate.id}`);
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error with ${candidate.id}:`, error.message);
      }
    }
    
    console.log('🎉 Sample embeddings created!');
    console.log('🔄 Now restart your dev server and test vector search');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createSampleEmbeddings().catch(console.error);
