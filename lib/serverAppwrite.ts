/**
 * Server-only Appwrite client using API key (no browser session).
 * Use in API routes so Jobs/Candidates work without Auth platform/CORS.
 */
import { Client, TablesDB, ID, Permission, Role, Query } from 'node-appwrite';

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const tablesDB = new TablesDB(client);

const DB_ID = 'recruitment_db';

function assertServerConfig() {
  if (!endpoint || !projectId || !apiKey) {
    throw new Error('Missing Appwrite server configuration (APPWRITE_ENDPOINT/PROJECT_ID/API_KEY).');
  }
}

/** Get first company ID, or create "Default Company" so jobs can require company_id. */
export async function getOrCreateDefaultCompanyId(): Promise<string> {
  assertServerConfig();
  const list = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId: 'companies',
    queries: [Query.limit(1)],
  });
  if (list.rows.length > 0) return list.rows[0].$id;
  const companyId = ID.unique();
  await tablesDB.createRow({
    databaseId: DB_ID,
    tableId: 'companies',
    rowId: companyId,
    data: { name: 'Default Company' },
    permissions: [Permission.read(Role.any()), Permission.write(Role.any())],
  });
  return companyId;
}

export async function listJobs() {
  assertServerConfig();
  const result = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId: 'jobs',
    queries: [Query.orderDesc('$createdAt')],
  });
  return result.rows;
}

export async function createJobRow(data: Record<string, unknown>) {
  assertServerConfig();
  const jobId = ID.unique();
  await tablesDB.createRow({
    databaseId: DB_ID,
    tableId: 'jobs',
    rowId: jobId,
    data,
    permissions: [Permission.read(Role.any()), Permission.write(Role.any())],
  });
  const row = await tablesDB.getRow({ databaseId: DB_ID, tableId: 'jobs', rowId: jobId });
  return row;
}

export async function listCandidates() {
  assertServerConfig();

  // Appwrite's default page size is 25. We paginate to collect ALL candidates.
  const pageSize = 100;
  let offset = 0;
  const allRows: any[] = [];

  while (true) {
    const result = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: 'candidates',
      queries: [Query.orderDesc('$createdAt'), Query.limit(pageSize), Query.offset(offset)],
    });

    const rows = result.rows ?? [];
    allRows.push(...rows);

    // If we got fewer rows than the page size, we've reached the last page
    if (rows.length < pageSize) break;

    offset += pageSize;
  }

  return allRows;
}

export async function getJobRow(jobId: string) {
  assertServerConfig();
  return await tablesDB.getRow({ databaseId: DB_ID, tableId: 'jobs', rowId: jobId });
}

export async function getCandidateRow(candidateId: string) {
  assertServerConfig();
  return await tablesDB.getRow({ databaseId: DB_ID, tableId: 'candidates', rowId: candidateId });
}

export async function listApplicationsForJob(jobId: string) {
  assertServerConfig();
  const result = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId: 'applications',
    queries: [Query.equal('job_id', jobId), Query.orderDesc('$createdAt')],
  });
  return result.rows;
}

export async function updateApplicationRow(applicationId: string, data: Record<string, unknown>) {
  assertServerConfig();
  return await tablesDB.updateRow({
    databaseId: DB_ID,
    tableId: 'applications',
    rowId: applicationId,
    data,
  });
}

// ==========================================
// Call Logs (server-side, admin access)
// ==========================================

export async function createCallLogRow(data: Record<string, unknown>) {
  assertServerConfig();
  const rowId = ID.unique();
  await tablesDB.createRow({
    databaseId: DB_ID,
    tableId: 'call_logs',
    rowId,
    data,
    permissions: [Permission.read(Role.any()), Permission.write(Role.any())],
  });
  return await tablesDB.getRow({ databaseId: DB_ID, tableId: 'call_logs', rowId });
}

export async function updateCallLogRow(rowId: string, data: Record<string, unknown>) {
  assertServerConfig();
  return await tablesDB.updateRow({
    databaseId: DB_ID,
    tableId: 'call_logs',
    rowId,
    data,
  });
}

export async function getCallLogRowByVapiId(vapiCallId: string) {
  assertServerConfig();
  try {
    const result = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: 'call_logs',
      queries: [Query.equal('vapi_call_id', vapiCallId), Query.limit(1)],
    });
    return result.rows?.[0] ?? null;
  } catch {
    // If the query fails (e.g., index not set up), do a manual scan
    const result = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: 'call_logs',
      queries: [Query.limit(100)],
    });
    return result.rows?.find((r: any) => r.vapi_call_id === vapiCallId) ?? null;
  }
}

export async function listCallLogsByCandidate(candidateId: string) {
  assertServerConfig();
  try {
    const result = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: 'call_logs',
      queries: [Query.equal('candidate_id', candidateId), Query.orderDesc('$createdAt')],
    });
    return result.rows ?? [];
  } catch {
    const result = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: 'call_logs',
      queries: [Query.limit(200), Query.orderDesc('$createdAt')],
    });
    return (result.rows ?? []).filter((r: any) => r.candidate_id === candidateId);
  }
}

// ==========================================
// Dashboard Stats and Activity
// ==========================================

export async function getDashboardStats() {
  assertServerConfig();
  const candidatesResult = await listCandidates();
  const jobsResult = await listJobs();

  let totalCompanies = 0;
  try {
    const companiesResult = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: 'companies',
      queries: [Query.limit(1000)]
    });
    totalCompanies = companiesResult.rows?.length || 0;
  } catch (e) { }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const candidatesThisMonth = candidatesResult.filter((c: any) => new Date(c.$createdAt) >= startOfMonth).length;
  const jobsThisWeek = jobsResult.filter((j: any) => new Date(j.$createdAt) >= startOfWeek).length;

  return {
    totalCandidates: candidatesResult.length,
    newCandidatesThisMonth: candidatesThisMonth,
    activeJobs: jobsResult.length,
    newJobsThisWeek: jobsThisWeek,
    totalCompanies,
  };
}

export async function getRecentActivity(limit = 6) {
  assertServerConfig();
  let candidates: any[] = [];
  let jobs: any[] = [];

  try {
    const cRes = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: 'candidates',
      queries: [Query.orderDesc('$createdAt'), Query.limit(limit)]
    });
    candidates = cRes.rows || [];
  } catch (e) { }

  try {
    const jRes = await tablesDB.listRows({
      databaseId: DB_ID,
      tableId: 'jobs',
      queries: [Query.orderDesc('$createdAt'), Query.limit(limit)]
    });
    jobs = jRes.rows || [];
  } catch (e) { }

  const activities = [
    ...candidates.map((c: any) => ({
      id: `candidate-${c.$id}`,
      type: 'candidate',
      title: 'New candidate added',
      description: `${c.firstName || ''} ${c.lastName || ''} added`,
      date: new Date(c.$createdAt)
    })),
    ...jobs.map((j: any) => ({
      id: `job-${j.$id}`,
      type: 'job',
      title: 'Job posted',
      description: `${j.title || 'New Job'} posted`,
      date: new Date(j.$createdAt)
    }))
  ];

  activities.sort((a, b) => b.date.getTime() - a.date.getTime());
  return activities.slice(0, limit);
}
