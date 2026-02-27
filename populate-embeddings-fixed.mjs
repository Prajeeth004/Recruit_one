// Simplified script to populate Qdrant with candidate embeddings
import dotenv from 'dotenv';
dotenv.config();

import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenAI } from '@google/genai';
import { Client, TablesDB, Query } from 'node-appwrite';

async function populateCandidateEmbeddings() {
  console.log('🚀 Populating Qdrant with candidate embeddings...');
  
  // Get environment variables
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  // Appwrite config
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
  const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  const appwriteApiKey = process.env.APPWRITE_API_KEY || '';
  
  if (!url || !apiKey || !geminiKey || !endpoint || !projectId || !appwriteApiKey) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  console.log('✅ Environment variables found');
  
  const qdrant = new QdrantClient({ url, apiKey });
  const ai = new GoogleGenAI({ apiKey: geminiKey });
  
  // Initialize Appwrite client
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(appwriteApiKey);
  const tablesDB = new TablesDB(client);
  const DB_ID = 'recruitment_db';
  
  try {
    // Clear existing collection to avoid conflicts
    try {
      console.log('🗑️ Deleting existing candidate_embeddings collection...');
      await qdrant.deleteCollection('candidate_embeddings');
      console.log('✅ Collection deleted');
    } catch (error) {
      console.log('ℹ️ Collection does not exist or cannot be deleted');
    }
    
    // Create fresh collection
    console.log('📦 Creating candidate_embeddings collection...');
    await qdrant.createCollection('candidate_embeddings', {
      vectors: {
        size: 1536,
        distance: 'Cosine'
      }
    });
    console.log('✅ Collection created');
    
    // Get candidates from database
    console.log('📊 Fetching candidates from database...');
    const result = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: 'candidates',
      queries: [Query.limit(11)], // Limit to first 11 for testing
    });
    
    const candidates = result.rows;
    console.log(`📊 Found ${candidates.length} candidates`);
    
    if (candidates.length === 0) {
      console.log('⚠️ No candidates found');
      return;
    }
    
    // Process each candidate
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      
      try {
        console.log(`🔍 Processing candidate ${i + 1}/${candidates.length}: ${candidate.$id}`);
        
        // Create simpler candidate text for embedding (limit length)
        const skills = Array.isArray(candidate.skills) 
          ? candidate.skills.slice(0, 10).join(', ') // Limit skills to first 10
          : (candidate.skills || '').toString().split(',').slice(0, 10).join(', ');
        
        const candidateText = `
Candidate: ${candidate.title || 'Unknown'}
Skills: ${skills}
Experience: ${candidate.total_experience || 0} years
Summary: ${(candidate.summary || '').substring(0, 200)}
`.trim();
        
        console.log(`📝 Text length: ${candidateText.length} chars`);
        
        // Generate embedding
        const res = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: [{ parts: [{ text: candidateText }] }],
          config: { outputDimensionality: 1536 },
        });
        
        const vector = res.embeddings?.[0]?.values;
        if (!vector || vector.length !== 1536) {
          console.error(`❌ Invalid embedding: ${vector?.length || 'null'} dimensions`);
          continue;
        }
        
        // Store in Qdrant with simpler payload
        await qdrant.upsert('candidate_embeddings', {
          points: [{
            id: candidate.$id,
            vector: vector,
            payload: {
              candidate_id: candidate.$id,
              title: candidate.title || '',
              skills: skills,
              experience: candidate.total_experience || 0
            }
          }]
        });
        
        console.log(`✅ Stored embedding for ${candidate.$id}`);
        
        // Rate limiting
        if (i < candidates.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${candidate.$id}:`, error.message);
        
        // Try with even simpler text
        try {
          console.log(`🔄 Retrying ${candidate.$id} with minimal text...`);
          const simpleText = `Candidate: ${candidate.title || 'Unknown'}. Skills: ${Array.isArray(candidate.skills) ? candidate.skills.slice(0, 5).join(', ') : 'None'}. Experience: ${candidate.total_experience || 0} years.`;
          
          const res = await ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: [{ parts: [{ text: simpleText }] }],
            config: { outputDimensionality: 1536 },
          });
          
          const vector = res.embeddings?.[0]?.values;
          if (vector && vector.length === 1536) {
            await qdrant.upsert('candidate_embeddings', {
              points: [{
                id: candidate.$id,
                vector: vector,
                payload: {
                  candidate_id: candidate.$id,
                  title: candidate.title || '',
                  skills: Array.isArray(candidate.skills) ? candidate.skills.slice(0, 5).join(', ') : '',
                  experience: candidate.total_experience || 0
                }
              }]
            });
            console.log(`✅ Stored simple embedding for ${candidate.$id}`);
          }
        } catch (retryError) {
          console.error(`❌ Retry failed for ${candidate.$id}:`, retryError.message);
        }
      }
    }
    
    console.log('🎉 Candidate embeddings populated successfully!');
    console.log('🔄 Restart your dev server to see vector search results');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
populateCandidateEmbeddings().catch(console.error);
