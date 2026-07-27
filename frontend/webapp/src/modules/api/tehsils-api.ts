import { apiRequest } from "@/lib/api-client"
import type { Settlement, Tehsil, Village } from "./types"

export function listTehsils(token: string): Promise<Tehsil[]> {
  return apiRequest<Tehsil[]>("/tehsils", { method: "GET", token })
}

export function listVillages(token: string, tehsilId: string): Promise<Village[]> {
  return apiRequest<Village[]>(`/tehsils/${tehsilId}/villages`, {
    method: "GET",
    token,
  })
}

export function listSettlements(token: string, villageId: string): Promise<Settlement[]> {
  return apiRequest<Settlement[]>(`/tehsils/villages/${villageId}/settlements`, {
    method: "GET",
    token,
  })
}

export function createVillage(
  token: string,
  tehsilId: string,
  name: string,
): Promise<Village> {
  return apiRequest<Village>(`/tehsils/${tehsilId}/villages`, {
    method: "POST",
    token,
    body: JSON.stringify({ name }),
  })
}

export function updateVillage(
  token: string,
  id: string,
  name: string,
): Promise<Village> {
  return apiRequest<Village>(`/tehsils/villages/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ name }),
  })
}

export function deleteVillage(token: string, id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/tehsils/villages/${id}`, {
    method: "DELETE",
    token,
  })
}

export function createSettlement(
  token: string,
  villageId: string,
  name: string,
): Promise<Settlement> {
  return apiRequest<Settlement>(`/tehsils/villages/${villageId}/settlements`, {
    method: "POST",
    token,
    body: JSON.stringify({ name }),
  })
}

export function updateSettlement(
  token: string,
  id: string,
  name: string,
): Promise<Settlement> {
  return apiRequest<Settlement>(`/tehsils/settlements/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ name }),
  })
}

export function deleteSettlement(
  token: string,
  id: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/tehsils/settlements/${id}`, {
    method: "DELETE",
    token,
  })
}
