import { createContext } from "react"
import type { AuthenticatedUser } from "./auth-types"

export type AuthState =
  | { status: "loading"; token: string | null; user: AuthenticatedUser | null }
  | { status: "authenticated"; token: string; user: AuthenticatedUser }
  | { status: "anonymous"; token: null; user: null }

export type AuthContextValue = AuthState & {
  signIn: (input: { email: string; password: string }) => Promise<AuthenticatedUser>
  signOut: () => void
  refreshProfile: () => Promise<void>
  changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

