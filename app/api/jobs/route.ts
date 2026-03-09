import { NextRequest, NextResponse } from 'next/server';
import { listJobs, listJobsByCompany, createJobRow, getOrCreateDefaultCompanyId, getOrCreateCompanyByName } from '@/lib/serverAppwrite';
import { GoogleGenAI } from '@google/genai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const companyId = request.nextUrl.searchParams.get('company_id');
    const jobs = companyId ? await listJobsByCompany(companyId) : await listJobs();

    const formattedJobs = jobs.map((job: any) => ({
      ...job,
      id: job.$id,
      company: job.company_name || job.company || 'Unknown',
    }));

    return NextResponse.json(formattedJobs);
  } catch (error: unknown) {
    console.error('Failed to list jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let companyId = body.company_id || body.companyId;
    if (!companyId && (body.company_name || body.company)) {
      companyId = await getOrCreateCompanyByName(body.company_name || body.company);
    } else if (!companyId) {
      companyId = await getOrCreateDefaultCompanyId();
    }

    const rawLocation = (body.jobLocationType || body.location_type || '')
      .toLowerCase()
      .replace(/[\s-]/g, '');
    const location_type =
      rawLocation === 'remote' || rawLocation === 'onsite' || rawLocation === 'hybrid' ? rawLocation : null;

    const jobRecord = {
      title: body.title,
      status: (body.status || 'open').toLowerCase().replace(/\s+/g, '_') || 'open',
      company_id: companyId,
      company_name: body.company_name || body.company || null,
      contact_id: body.contact_id || body.contactId || null,
      description: body.jobDescription || body.description || null,
      city: body.city || null,
      locality: body.locality || null,
      address: body.fullAddress || body.address || null,
      postal_code: body.postalCode || body.postal_code || null,
      location_type,
      min_experience: body.minExperience ?? body.min_experience ?? null,
      max_experience: body.maxExperience ?? body.max_experience ?? null,
      min_salary: body.minSalary ?? body.min_salary ?? null,
      max_salary: body.maxSalary ?? body.max_salary ?? null,
      currency: body.currency || body.currencyType || 'INR',
      openings: body.openings ?? 1,
      skills: body.keywords
        ? (Array.isArray(body.keywords) ? body.keywords : body.keywords.split(',').map((s: string) => s.trim()))
        : body.skills || [],
      owner_id: body.owner_id || body.ownerId || null,
      pipeline_id: body.pipeline_id || body.pipelineId || body.hiringPipeline || null,
      embedding_id: null,
    };

    const record = await createJobRow(jobRecord);
    const jobId = record.$id;

    // Generate embedding and upload to Qdrant
    try {
      const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      const qdrantUrl = process.env.NEXT_PUBLIC_QDRANT_URL || process.env.QDRANT_URL;
      const qdrantApiKey = process.env.NEXT_PUBLIC_QDRANT_API_KEY || process.env.QDRANT_API_KEY;

      if (geminiApiKey && qdrantUrl && qdrantApiKey) {
        // Generate embedding using Gemini
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const textToEmbed = [
          body.title,
          body.jobDescription || body.description,
          body.keywords
            ? (Array.isArray(body.keywords) ? body.keywords : body.keywords.split(',').map((s: string) => s.trim())).join(', ')
            : body.skills?.join(', ') || '',
          `Company: ${body.company || body.company_name || 'Unknown'}`,
          `Experience: ${body.minExperience ?? body.min_experience ?? 'N/A'} - ${body.maxExperience ?? body.max_experience ?? 'N/A'} years`,
          `Salary: ${body.minSalary ?? body.min_salary ?? 'N/A'} - ${body.maxSalary ?? body.max_salary ?? 'N/A'} ${body.currency || body.currencyType || 'INR'}`,
        ]
          .filter(Boolean)
          .join('. ');

        const embeddingResult = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: textToEmbed,
          config: {
            outputDimensionality: 1536,
          },
        });

        // Extract embedding values from the response structure
        const embedding = embeddingResult.embeddings?.[0]?.values;

        if (embedding && Array.isArray(embedding)) {
          // Upload to Qdrant
          const qdrantClient = new QdrantClient({
            url: qdrantUrl,
            apiKey: qdrantApiKey,
          });

          const qdrantId = randomUUID();
          await qdrantClient.upsert('job_embeddings', {
            points: [
              {
                id: qdrantId,
                vector: embedding,
                payload: {
                  job_id: jobId,
                  title: body.title,
                  skills: body.keywords
                    ? (Array.isArray(body.keywords) ? body.keywords : body.keywords.split(',').map((s: string) => s.trim()))
                    : body.skills || [],
                  company: body.company || body.company_name || 'Unknown',
                },
              },
            ],
          });

          console.log(`Job ${jobId} embedding uploaded to Qdrant with ID: ${qdrantId}`);
        } else {
          console.warn('Failed to extract embedding from Gemini response');
        }
      } else {
        console.warn('Missing Gemini or Qdrant credentials, skipping embedding generation');
      }
    } catch (embeddingError) {
      console.error('Error generating/uploading embedding (non-fatal):', embeddingError);
      // Don't fail the job creation if embedding fails
    }

    return NextResponse.json(record);
  } catch (error: unknown) {
    console.error('Failed to create job:', error);
    return NextResponse.json(
      { error: 'Failed to create job', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
