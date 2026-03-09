/**
 * Client-side fetch wrappers over the /api/companies REST routes.
 * Column names match setup/appwrite.js: address, city, state, country, owner_id, hotlist
 */
import { Company } from '@/lib/mock-data';

export async function getCompanies(): Promise<Company[]> {
  const res = await fetch('/api/companies');
  if (!res.ok) throw new Error('Failed to fetch companies');
  return res.json();
}

export interface CreateCompanyInput {
  name: string;
  industry?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  owner_id?: string;
  hotlist?: boolean;
}

export async function createCompany(data: CreateCompanyInput): Promise<Company> {
  const res = await fetch('/api/companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create company');
  }
  return res.json();
}

export async function deleteCompany(id: string): Promise<void> {
  const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete company');
}

export async function updateCompany(id: string, data: Partial<CreateCompanyInput>): Promise<void> {
  const res = await fetch(`/api/companies/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update company');
}
