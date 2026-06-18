import { apiRequest } from "@/lib/api-client"
import type { AuthResult, AuthenticatedUser } from "./auth-types"

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  return apiRequest<AuthResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function getProfile(token: string): Promise<AuthenticatedUser> {
  return apiRequest<AuthenticatedUser>("/auth/profile", {
    method: "GET",
    token,
  })
}
