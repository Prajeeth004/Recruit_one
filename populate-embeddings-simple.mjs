// Script to populate Qdrant with candidate embeddings from your database
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
  
  if (!url || !apiKey) {
    console.error('❌ QDRANT_URL or QDRANT_API_KEY not found');
    return;
  }
  
  if (!geminiKey) {
    console.error('❌ Gemini API key not found');
    return;
  }
  
  if (!endpoint || !projectId || !appwriteApiKey) {
    console.error('❌ Appwrite configuration not found');
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
    // Check if collection exists
    console.log('📦 Checking candidate_embeddings collection...');
    const collections = await qdrant.getCollections();
    const hasCandidateCollection = collections.collections.some(c => c.name === 'candidate_embeddings');
    
    if (!hasCandidateCollection) {
      console.log('📦 Creating candidate_embeddings collection...');
      await qdrant.createCollection('candidate_embeddings', {
        vectors: {
          size: 1536,
          distance: 'Cosine'
        }
      });
      console.log('✅ Collection created');
    } else {
      console.log('📦 Collection already exists');
    }
    
    // Get actual candidates from database
    console.log('📊 Fetching candidates from database...');
    const result = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: 'candidates',
      queries: [Query.orderDesc('$createdAt')],
    });
    
    const candidates = result.rows;
    console.log(`📊 Found ${candidates.length} candidates`);
    
    if (candidates.length === 0) {
      console.log('⚠️ No candidates found in database');
      return;
    }
    
    // Process each candidate
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      
      try {
        console.log(`🔍 Processing candidate ${i + 1}/${candidates.length}: ${candidate.$id}`);
        
        // Create candidate text for embedding
        const skills = Array.isArray(candidate.skills) 
          ? candidate.skills.join(', ') 
          : (candidate.skills || '');
        
        const candidateText = `
Title: ${candidate.title || ''}
Skills: ${skills}
Summary: ${candidate.summary || ''}
Experience: ${candidate.total_experience || 0} years total, ${candidate.relevant_experience || 0} years relevant
Email: ${candidate.email || ''}
`.trim();
        
        console.log(`📝 Candidate text: ${candidateText.substring(0, 100)}...`);
        
        // Generate embedding
        const res = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: [{ parts: [{ text: candidateText }] }],
          config: { outputDimensionality: 1536 },
        });
        
        const vector = res.embeddings?.[0]?.values;
        if (!vector || vector.length !== 1536) {
          console.error(`❌ Failed to create embedding for ${candidate.$id}: ${vector?.length || 'null'} dimensions`);
          continue;
        }
        
        // Store in Qdrant
        await qdrant.upsert('candidate_embeddings', {
          points: [{
            id: candidate.$id,
            vector: vector,
            payload: {
              candidate_id: candidate.$id,
              title: candidate.title,
              skills: candidate.skills,
              summary: candidate.summary,
              total_experience: candidate.total_experience,
              relevant_experience: candidate.relevant_experience,
              email: candidate.email
            }
          }]
        });
        
        console.log(`✅ Stored embedding for ${candidate.$id}`);
        
        // Rate limiting to avoid API limits
        if (i < candidates.length - 1) {
          console.log('⏳ Waiting 2 seconds before next candidate...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${candidate.$id}:`, error.message);
      }
    }
    
    console.log('🎉 Candidate embeddings populated successfully!');
    console.log('🔄 Please restart your dev server to see vector search results');
    
  } catch (error) {
    console.error('❌ Error populating embeddings:', error);
  }
}

// Run the script
populateCandidateEmbeddings().catch(console.error);
