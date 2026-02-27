// Quick script to populate candidate embeddings
import dotenv from 'dotenv';
dotenv.config();

import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenAI } from '@google/genai';
import { Client, TablesDB, Query } from 'node-appwrite';

async function populateEmbeddings() {
  console.log('🚀 Populating candidate embeddings...');
  
  // Environment variables
  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantKey = process.env.QDRANT_API_KEY;
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const appwriteKey = process.env.APPWRITE_API_KEY;
  
  if (!qdrantUrl || !qdrantKey || !geminiKey || !endpoint || !projectId || !appwriteKey) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  const qdrant = new QdrantClient({ url: qdrantUrl, apiKey: qdrantKey });
  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(appwriteKey);
  const tablesDB = new TablesDB(client);
  
  try {
    // Reset collection
    try {
      await qdrant.deleteCollection('candidate_embeddings');
      console.log('🗑️ Deleted existing collection');
    } catch {}
    
    await qdrant.createCollection('candidate_embeddings', {
      vectors: { size: 1536, distance: 'Cosine' }
    });
    console.log('✅ Created collection');
    
    // Get candidates
    const result = await tablesDB.listRows({
      databaseId: 'recruitment_db',
      tableId: 'candidates',
      queries: [Query.limit(20)]
    });
    
    const candidates = result.rows;
    console.log(`📊 Found ${candidates.length} candidates`);
    
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      
      try {
        // Create simple text for embedding
        const skills = Array.isArray(c.skills) ? c.skills.join(', ') : String(c.skills || '');
        const text = `Title: ${c.title || ''}. Skills: ${skills}. Experience: ${c.total_experience || 0} years. Summary: ${(c.summary || '').substring(0, 200)}`;
        
        console.log(`🔍 Processing ${i + 1}/${candidates.length}: ${c.$id}`);
        
        // Create embedding
        const res = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: [{ parts: [{ text }] }],
          config: { outputDimensionality: 1536 }
        });
        
        const vector = res.embeddings?.[0]?.values;
        if (!vector || vector.length !== 1536) {
          console.error(`❌ Invalid embedding for ${c.$id}`);
          continue;
        }
        
        // Store in Qdrant
        await qdrant.upsert('candidate_embeddings', {
          points: [{
            id: c.$id,
            vector: vector,
            payload: {
              candidate_id: c.$id,
              title: c.title,
              skills: skills,
              experience: c.total_experience
            }
          }]
        });
        
        console.log(`✅ Stored ${c.$id}`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error with ${c.$id}:`, error.message);
      }
    }
    
    console.log('🎉 Embeddings populated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

populateEmbeddings().catch(console.error);
