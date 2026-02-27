// Script to populate Qdrant with candidate embeddings
import { rankCandidatesForJob } from './lib/server/candidateRanking.js';
import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenAI } from '@google/genai';

async function populateCandidateEmbeddings() {
  console.log('🚀 Populating Qdrant with candidate embeddings...');
  
  // Get Qdrant client
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;
  if (!url || !apiKey) {
    console.error('❌ QDRANT_URL or QDRANT_API_KEY not found');
    return;
  }
  
  const qdrant = new QdrantClient({ url, apiKey });
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.error('❌ Gemini API key not found');
    return;
  }
  
  const ai = new GoogleGenAI({ apiKey: geminiKey });
  
  try {
    // Check if collection exists
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
    
    // Get candidates from your database (you'll need to modify this part)
    // This is a placeholder - you need to fetch actual candidates from your Appwrite DB
    const mockCandidates = [
      {
        $id: '699b0aa300164311fade',
        title: 'Frontend Developer',
        skills: ['React', 'TypeScript', 'JavaScript'],
        summary: 'Experienced frontend developer with React expertise',
        total_experience: 4,
        relevant_experience: 3
      },
      {
        $id: '69981c6a002052c3fcf7',
        title: 'Full Stack Developer', 
        skills: ['React', 'Node.js', 'Python'],
        summary: 'Full stack developer with some frontend experience',
        total_experience: 5,
        relevant_experience: 2
      }
      // Add more candidates as needed
    ];
    
    console.log(`📊 Processing ${mockCandidates.length} candidates...`);
    
    for (const candidate of mockCandidates) {
      try {
        // Create candidate text for embedding
        const candidateText = `
Title: ${candidate.title}
Skills: ${candidate.skills?.join(', ') || ''}
Summary: ${candidate.summary || ''}
Experience: ${candidate.total_experience || 0} years
`;
        
        console.log(`🔍 Creating embedding for ${candidate.$id}...`);
        
        // Generate embedding
        const res = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: [{ parts: [{ text: candidateText }] }],
          config: { outputDimensionality: 1536 },
        });
        
        const vector = res.embeddings?.[0]?.values;
        if (!vector || vector.length !== 1536) {
          console.error(`❌ Failed to create embedding for ${candidate.$id}`);
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
              relevant_experience: candidate.relevant_experience
            }
          }]
        });
        
        console.log(`✅ Stored embedding for ${candidate.$id}`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing ${candidate.$id}:`, error.message);
      }
    }
    
    console.log('🎉 Candidate embeddings populated successfully!');
    
  } catch (error) {
    console.error('❌ Error populating embeddings:', error);
  }
}

// Uncomment to run
// populateCandidateEmbeddings();
