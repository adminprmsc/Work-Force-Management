import { apiRequest } from '@/lib/api-client';
import {
  cacheProcurementPackage,
  getCachedProcurementPackage,
} from '@/modules/offline/offline-store';
import type {
  PackageFormBaseline,
  ProcurementPackage,
  SavePackageBaselineInput,
  Settlement,
  Tehsil,
  Village,
} from './types';

export function listTehsils(token: string): Promise<Tehsil[]> {
  return apiRequest<Tehsil[]>('/tehsils', { method: 'GET', token });
}

export function listVillages(token: string, tehsilId: string): Promise<Village[]> {
  return apiRequest<Village[]>(`/tehsils/${tehsilId}/villages`, {
    method: 'GET',
    token,
  });
}

export function listSettlements(token: string, villageId: string): Promise<Settlement[]> {
  return apiRequest<Settlement[]>(`/tehsils/villages/${villageId}/settlements`, {
    method: 'GET',
    token,
  });
}

export function getProcurementPackage(
  token: string,
  id: string,
): Promise<ProcurementPackage> {
  return apiRequest<ProcurementPackage>(`/procurement-packages/${id}`, {
    method: 'GET',
    token,
  });
}

/** Fetch a package from the API and cache it; fall back to cache when offline. */
export async function fetchProcurementPackageWithCache(
  token: string,
  packageId: string,
): Promise<ProcurementPackage> {
  try {
    const pkg = await getProcurementPackage(token, packageId);
    await cacheProcurementPackage(pkg);
    return pkg;
  } catch {
    const cached = await getCachedProcurementPackage(packageId);
    if (cached) return cached;
    throw new Error(
      'Could not load package villages. Connect to the internet once, then open your assignments.',
    );
  }
}

export function getPackageFormBaseline(
  token: string,
  packageId: string,
  formId: string,
): Promise<PackageFormBaseline> {
  return apiRequest<PackageFormBaseline>(
    `/procurement-packages/${packageId}/forms/${formId}/baseline`,
    { method: 'GET', token },
  );
}

export function savePackageFormBaseline(
  token: string,
  packageId: string,
  formId: string,
  input: SavePackageBaselineInput,
): Promise<PackageFormBaseline> {
  return apiRequest<PackageFormBaseline>(
    `/procurement-packages/${packageId}/forms/${formId}/baseline`,
    {
      method: 'PUT',
      token,
      body: JSON.stringify(input),
    },
  );
}
