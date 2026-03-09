import { NextRequest, NextResponse } from 'next/server';
import { listCompanies, createCompanyRow, listJobs } from '@/lib/serverAppwrite';

export async function GET() {
  try {
    const [rows, jobs] = await Promise.all([
      listCompanies(),
      listJobs()
    ]);

    // Group jobs by company_id to count how many are open
    const openJobCounts: Record<string, number> = {};
    for (const job of jobs) {
      if (job.status?.toLowerCase() === 'open' && job.company_id) {
        openJobCounts[job.company_id] = (openJobCounts[job.company_id] || 0) + 1;
      }
    }

    // Normalise DB column names → Company interface field names used on the frontend
    const companies = rows.map((row: any) => ({
      id: row.$id,
      name: row.name ?? '',
      industry: row.industry ?? '',
      fullAddress: [row.address, row.city, row.state, row.country]
        .filter(Boolean)
        .join(', '),
      address: row.address ?? '',
      city: row.city ?? '',
      state: row.state ?? '',
      country: row.country ?? '',
      website: row.website ?? '',
      owner: row.owner_id ?? '',
      hotlist: row.hotlist ?? false,
      
      // Map the dynamic count from the jobs table
      openJobs: openJobCounts[row.$id] || 0,
      closedJobs: 0,
      onHoldJobs: 0,
      cancelledJobs: 0,
    }));

    return NextResponse.json(companies);
  } catch (error: unknown) {
    console.error('Failed to list companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Map frontend fields → real Appwrite column names
    const data: Record<string, unknown> = {
      name: body.name,
      industry: body.industry ?? null,
      // Accept either a combined fullAddress or separate fields
      address: body.address ?? body.fullAddress ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      country: body.country ?? null,
      website: body.website ?? null,
      owner_id: body.owner_id ?? body.owner ?? null,
      hotlist: body.hotlist ?? false,
    };

    const row = await createCompanyRow(data);

    // Return in frontend-friendly shape
    return NextResponse.json({
      id: row.$id,
      name: row.name ?? '',
      industry: row.industry ?? '',
      fullAddress: [row.address, row.city, row.state, row.country].filter(Boolean).join(', '),
      address: row.address ?? '',
      city: row.city ?? '',
      state: row.state ?? '',
      country: row.country ?? '',
      website: row.website ?? '',
      owner: row.owner_id ?? '',
      hotlist: row.hotlist ?? false,
      openJobs: 0,
      closedJobs: 0,
      onHoldJobs: 0,
      cancelledJobs: 0,
    });
  } catch (error: unknown) {
    console.error('Failed to create company:', error);
    return NextResponse.json(
      { error: 'Failed to create company', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
