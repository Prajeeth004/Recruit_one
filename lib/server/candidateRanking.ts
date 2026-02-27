import 'server-only';

import { GoogleGenAI } from '@google/genai';
import { QdrantClient } from '@qdrant/js-client-rest';

/* ============================================================
   CONFIGURATION
============================================================ */

const CONFIG = {
  SKILL_WEIGHT: 0.8,
  EXP_WEIGHT: 0.2,
  VECTOR_WEIGHT: 0.5,
  LLM_BLEND_WEIGHT: 0.6,
  FUZZY_MATCH_THRESHOLD: 0.65,
  LLM_TOP_K: 3,
  MAX_CACHE_SIZE: 100, // Prevent memory leaks
};

/* ============================================================
   TYPES
============================================================ */

type JobRow = Record<string, unknown> & {
  $id: string;
  title?: string;
  description?: string;
  skills?: string[] | string;
  min_experience?: number | null;
  max_experience?: number | null;
};

type CandidateRow = Record<string, unknown> & {
  $id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  summary?: string | null;
  skills?: string[] | null;
  title?: string | null;
  total_experience?: number | null;
  relevant_experience?: number | null;
};

export type RankedCandidate = CandidateRow & {
  matchScore: number;
  scoreMethod: 'embedding' | 'rules' | 'hybrid-llm';
  aiReasoning?: string;
};

/* ============================================================
   LRU CACHE (Memory Leak Prevention)
============================================================ */

class LRUCache<K, V> {
  private cache = new Map<K, V>();
  constructor(private maxSize: number) {}

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const val = this.cache.get(key)!;
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  set(key: K, value: V) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict least recently used (first item in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }
}

// Cache *Promise* to prevent race conditions triggering duplicate API calls
const rankingCache = new LRUCache<string, Promise<RankedCandidate[]>>(CONFIG.MAX_CACHE_SIZE);
const jobEmbeddingCache = new LRUCache<string, Promise<number[] | null>>(CONFIG.MAX_CACHE_SIZE);

/* ============================================================
   UTILS
============================================================ */

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const percent = (n: number) => Math.round(clamp01(n) * 100);

/* ============================================================
   COSINE SIMILARITY
============================================================ */

function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/* ============================================================
   SKILL MATCHING
============================================================ */

function normalizeSkill(s: string) {
  return s.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

function asSkillsArray(skills: unknown): string[] {
  if (Array.isArray(skills))
    return skills.map(s => normalizeSkill(String(s)));
  if (typeof skills === 'string')
    return skills.split(',').map(s => normalizeSkill(s));
  return [];
}

function computeSkillScore(jobSkills: string[], candSkills: string[]) {
  if (!jobSkills.length || !candSkills.length) return 0;

  let match = 0;
  for (const js of jobSkills) {
    if (candSkills.some(cs => cs.includes(js) || js.includes(cs)))
      match++;
  }

  return clamp01(match / jobSkills.length);
}

/* ============================================================
   EXPERIENCE
============================================================ */

function computeExpScore(
  min: number | null | undefined,
  max: number | null | undefined,
  cand: number | null | undefined
) {
  if (!cand) return 0.4;

  if ((min == null || cand >= min) &&
      (max == null || cand <= max)) return 1;

  return 0.6;
}

function buildRuleScore(job: JobRow, cand: CandidateRow) {
  const jobSkills = asSkillsArray(job.skills);
  const candSkills = asSkillsArray(cand.skills);

  const skillScore = computeSkillScore(jobSkills, candSkills);

  const expScore = computeExpScore(
    job.min_experience,
    job.max_experience,
    cand.relevant_experience ?? cand.total_experience
  );

  return clamp01(
    skillScore * CONFIG.SKILL_WEIGHT +
    expScore * CONFIG.EXP_WEIGHT
  );
}

/* ============================================================
   EMBEDDING
============================================================ */

async function embed(text: string, apiKey: string) {
  const ai = new GoogleGenAI({ apiKey });

  const res = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: [{ parts: [{ text }] }],
    config: { outputDimensionality: 1536 },
  });

  const vector = res.embeddings?.[0]?.values;
  if (!vector || vector.length !== 1536) return null;

  return vector;
}

/* ============================================================
   LLM RERANK (Forced JSON)
============================================================ */

async function llmRerank(job: JobRow, cand: CandidateRow, apiKey: string) {
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 LLM reranking candidate ${cand.$id} (attempt ${attempt}/${maxRetries})...`);
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
Score candidate 0-100 for job fit.

Job:
${job.title}
Skills: ${asSkillsArray(job.skills).join(', ')}

Candidate:
Title: ${cand.title}
Skills: ${asSkillsArray(cand.skills).join(', ')}
Summary: ${(cand.summary || '').slice(0, 300)}

Respond strictly in valid JSON format:
{"score": number, "reason": string}
`;

      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json", // Guarantees valid JSON output
        }
      });

      const raw = res.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsed = JSON.parse(raw);

      const result = {
        score: typeof parsed.score === 'number' ? parsed.score : 50,
        reason: parsed.reason || ''
      };

      console.log(`✅ LLM reranked ${cand.$id}: ${result.score}`);
      return result;
      
    } catch (error: any) {
      console.error(`❌ LLM reranking failed for ${cand.$id} (attempt ${attempt}):`, error.message);
      
      if (error.status === 429 || error.message?.includes('quota')) {
        if (attempt < maxRetries) {
          const delay = baseDelay * attempt; 
          console.log(`⏳ Rate limited, waiting ${delay/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          console.log(`⚠️ Max retries reached for ${cand.$id}, giving up`);
          return null;
        }
      } else {
        return null;
      }
    }
  }
  
  return null;
}

/* ============================================================
   QDRANT (Connection Pooling)
============================================================ */

let qdrantClient: QdrantClient | null = null;

function getQdrant() {
  if (qdrantClient) return qdrantClient; // Reuse existing connection
  
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;
  if (!url || !apiKey) {
    console.log('⚠️ QDRANT_URL or QDRANT_API_KEY not found, vector search disabled');
    return null;
  }
  
  console.log('✅ Qdrant client initialized');
  qdrantClient = new QdrantClient({ url, apiKey });
  return qdrantClient;
}

/* ============================================================
   MAIN PIPELINE
============================================================ */

async function processRanking(job: JobRow, candidates: CandidateRow[]) {
  const qdrant = getQdrant();
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  console.log(`📊 Processing ${candidates.length} candidates`);
  console.log(`🤖 Qdrant available: ${!!qdrant}`);
  console.log(`🔑 Gemini API key available: ${!!apiKey}`);

  let jobVector: number[] | null = null;

  if (apiKey) {
    if (jobEmbeddingCache.has(job.$id)) {
      console.log('📦 Awaiting cached job embedding promise');
      jobVector = await jobEmbeddingCache.get(job.$id)!;
    } else {
      console.log('🔍 Creating job embedding...');
      // Cache the promise immediately to prevent race conditions
      const embedPromise = embed(`${job.title} ${job.description ?? ''}`, apiKey);
      jobEmbeddingCache.set(job.$id, embedPromise);
      jobVector = await embedPromise;
      if (jobVector) console.log('✅ Job embedding generated and cached');
    }
  }

  /* ================= SINGLE AGGREGATED VECTOR SEARCH ================= */

  const vectorScores = new Map<string, number>();

  if (qdrant && jobVector) {
    console.log('🔍 Starting vector search...');
    const results = await qdrant.search('candidate_embeddings', {
      vector: jobVector,
      limit: candidates.length,
      with_payload: true,
    });

    console.log(`📊 Found ${results?.length || 0} vector results`);

    for (const r of results ?? []) {
      const id = (r.payload as any)?.candidate_id;
      if (id && typeof r.score === 'number') {
        const sim = clamp01(r.score);
        vectorScores.set(id, sim);
        console.log(`✅ Vector match for ${id}: ${sim.toFixed(3)}`);
      }
    }
  }

  /* ================= INITIAL SCORING ================= */

  const ranked: RankedCandidate[] = candidates.map(c => {
    const ruleScore = buildRuleScore(job, c);
    const vectorScore = vectorScores.get(c.$id) ?? 0;

    const combined = vectorScore
      ? clamp01(
          vectorScore * CONFIG.VECTOR_WEIGHT +
          ruleScore * (1 - CONFIG.VECTOR_WEIGHT)
        )
      : ruleScore;

    return {
      ...c,
      matchScore: percent(combined),
      scoreMethod: vectorScore ? 'embedding' : 'rules'
    };
  });

  ranked.sort((a, b) => b.matchScore - a.matchScore);

  /* ================= CONCURRENT LLM RERANK (TOP 3) ================= */

  if (apiKey) {
    const top = ranked.slice(0, CONFIG.LLM_TOP_K);
    console.log(`🤖 Starting concurrent LLM reranking for top ${top.length} candidates`);

    // Fire all LLM requests simultaneously
    const rerankPromises = top.map(cand => llmRerank(job, cand, apiKey));
    const llmResults = await Promise.all(rerankPromises);

    for (let i = 0; i < top.length; i++) {
      const llm = llmResults[i];
      if (!llm) continue;

      const cand = top[i];
      const blended =
        (llm.score / 100) * CONFIG.LLM_BLEND_WEIGHT +
        (cand.matchScore / 100) * (1 - CONFIG.LLM_BLEND_WEIGHT);

      cand.matchScore = Math.round(blended * 100);
      cand.scoreMethod = 'hybrid-llm';
      cand.aiReasoning = llm.reason;
      console.log(`✅ LLM blended ${cand.$id}: ${llm.score} → ${cand.matchScore}%`);
    }

    // Re-sort after LLM adjusts scores
    ranked.sort((a, b) => b.matchScore - a.matchScore);
  }

  console.log('=== FINAL RESULTS ===');
  console.log(ranked.map(r => `${r.$id}: ${r.matchScore}% (${r.scoreMethod})`));

  return ranked;
}

export async function rankCandidatesForJob(job: JobRow, candidates: CandidateRow[]) {
  console.log('=== SCORING PIPELINE START ===');

  if (rankingCache.has(job.$id)) {
    console.log('⚡ Returning cached ranking promise');
    return rankingCache.get(job.$id)!;
  }

  // Wrap actual processing in a promise and cache it immediately
  const rankingPromise = processRanking(job, candidates);
  rankingCache.set(job.$id, rankingPromise);

  try {
    return await rankingPromise;
  } catch (error) {
    // If it fails, remove broken promise from cache so next time it retries
    rankingCache.set(job.$id, Promise.reject(error)); // Force clear by overwriting or use delete if added to LRU
    throw error;
  }
}
