import { NextRequest, NextResponse } from 'next/server';
import { deleteCompanyRow, updateCompanyRow, getCompanyRow } from '@/lib/serverAppwrite';

function normaliseCompany(row: any) {
  return {
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
  };
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const row = await getCompanyRow(id);
    return NextResponse.json(normaliseCompany(row));
  } catch (error: unknown) {
    console.error('Failed to get company:', error);
    return NextResponse.json(
      { error: 'Company not found', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 404 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    await deleteCompanyRow(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to delete company:', error);
    return NextResponse.json(
      { error: 'Failed to delete company', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.industry !== undefined) data.industry = body.industry || null;
    if (body.address !== undefined) data.address = body.address || null;
    if (body.city !== undefined) data.city = body.city || null;
    if (body.state !== undefined) data.state = body.state || null;
    if (body.country !== undefined) data.country = body.country || null;
    if (body.website !== undefined) data.website = body.website || null;
    
    // owner / owner_id
    if (body.owner_id !== undefined) data.owner_id = body.owner_id || null;
    else if (body.owner !== undefined) data.owner_id = body.owner || null;
    
    if (body.hotlist !== undefined) data.hotlist = body.hotlist;

    const row = await updateCompanyRow(id, data);
    return NextResponse.json({ success: true, row });
  } catch (error: unknown) {
    console.error('Failed to update company:', error);
    // Include full error stack in dev so we see the exact Appwrite rejection
    return NextResponse.json(
      { 
        error: 'Failed to update company', 
        details: error instanceof Error ? error.message : 'Unknown error',
        fullError: String(error)
      },
      { status: 500 }
    );
  }
}
