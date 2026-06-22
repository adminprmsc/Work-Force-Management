import { apiRequest } from "@/lib/api-client"
import type { Role } from "@/modules/auth/roles"
import type { User } from "./types"

export type CreateUserInput = {
  email: string
  username: string
  password: string
  role: Role
  officeId?: string
}

export type UpdateUserInput = {
  email?: string
  username?: string
  officeId?: string
}

export type ResetUserCredentialsResult = {
  email: string
  username: string
  temporaryPassword: string
}

export function listUsers(token: string): Promise<User[]> {
  return apiRequest<User[]>("/users", { method: "GET", token })
}

export function createUser(token: string, input: CreateUserInput): Promise<User> {
  return apiRequest<User>("/users", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  })
}

export function updateUser(
  token: string,
  userId: string,
  input: UpdateUserInput,
): Promise<User> {
  return apiRequest<User>(`/users/${userId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  })
}

export function updateUserStatus(
  token: string,
  userId: string,
  active: boolean,
): Promise<User> {
  return apiRequest<User>(`/users/${userId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ active }),
  })
}

export function deleteUser(token: string, userId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/users/${userId}`, {
    method: "DELETE",
    token,
  })
}

export function resetUserCredentials(
  token: string,
  userId: string,
): Promise<ResetUserCredentialsResult> {
  return apiRequest<ResetUserCredentialsResult>(`/users/${userId}/reset-credentials`, {
    method: "POST",
    token,
  })
}
