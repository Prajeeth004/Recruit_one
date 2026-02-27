import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getJobRow, getCandidateRow, listApplicationsForJob, updateApplicationRow, listCandidates } from '@/lib/serverAppwrite';
import { rankCandidatesForJob } from '@/lib/server/candidateRanking';

const paramsSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
});

const querySchema = z.object({
  top: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || v === 5 || v === 10, { message: 'top must be 5 or 10' }),
});

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = paramsSchema.parse(await ctx.params);
    const { top } = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams.entries()));

    const job = await getJobRow(jobId);

    // Get all candidates from the database
    const allCandidates = await listCandidates();
    
    // Get existing applications for this job (if any)
    const applications = await listApplicationsForJob(jobId);
    
    // Create a map of candidate_id to application data for quick lookup
    const applicationMap = new Map(
      applications.map((app: any) => [app.candidate_id, app])
    );

    if (allCandidates.length === 0) {
      return NextResponse.json([]);
    }

    // Rank all candidates for this job
    const rankedAll = await rankCandidatesForJob(job as any, allCandidates);
    const ranked = typeof top === 'number' ? rankedAll.slice(0, top) : rankedAll;

    // Build response in ranked order
    const response = ranked
      .map((r) => {
        const candidate = allCandidates.find((c: any) => c.$id === r.$id);
        if (!candidate) return null;
        
        const application = applicationMap.get(candidate.$id);
        
        return {
          ...candidate,
          application: application || {
            $id: null,
            candidate_id: candidate.$id,
            job_id: jobId,
            status: 'New',
            assigned_at: new Date().toISOString()
          },
          status: application?.status || 'New',
          matchScore: r.matchScore,
          scoreMethod: r.scoreMethod,
          scoreDetails: r.scoreDetails,
        };
      })
      .filter(Boolean);

    // Persist scores into application rows (best-effort; non-fatal if schema isn't updated yet).
    await Promise.all(
      rankedAll.map(async (r) => {
        const candidate = allCandidates.find((c: any) => c.$id === r.$id);
        if (!candidate) return;
        
        const application = applicationMap.get(candidate.$id);
        if (!application) return;
        
        try {
          await updateApplicationRow(application.$id, {
            match_score: r.matchScore,
            scored_at: new Date().toISOString(),
            score_method: r.scoreMethod,
            score_details: r.scoreDetails ? JSON.stringify(r.scoreDetails) : null,
          });
        } catch {
          // Non-fatal (e.g., missing columns). We still return results.
        }
      })
    );

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('top must be') || message.includes('Invalid') ? 400 : 500;
    console.error('Failed to fetch ranked candidates for job:', error);
    return NextResponse.json({ error: 'Failed to fetch candidates', details: message }, { status });
  }
}

