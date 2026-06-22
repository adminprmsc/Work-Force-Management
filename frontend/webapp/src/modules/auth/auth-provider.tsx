import React, { useCallback, useEffect, useMemo, useState } from "react"
import { changePassword as changePasswordApi, getProfile, login } from "./auth-api"
import type { AuthenticatedUser } from "./auth-types"
import { AuthContext, type AuthState, type AuthContextValue } from "./auth-context"

const STORAGE_KEY = "wfm.auth.token"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem(STORAGE_KEY)
    if (!token) return { status: "anonymous", token: null, user: null }
    return { status: "loading", token, user: null }
  })

  const refreshProfile = useCallback(async () => {
    const token = state.token
    if (!token) return

    try {
      const user = await getProfile(token)
      setState({ status: "authenticated", token, user })
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      setState({ status: "anonymous", token: null, user: null })
    }
  }, [state.token])

  useEffect(() => {
    if (state.status !== "loading") return
    // Avoid triggering state updates synchronously inside the effect body.
    void Promise.resolve().then(() => refreshProfile())
  }, [refreshProfile, state.status])

  const signIn = useCallback(async (input: { email: string; password: string }) => {
    const res = await login(input)
    localStorage.setItem(STORAGE_KEY, res.accessToken)
    const user: AuthenticatedUser = {
      id: res.user.id,
      email: res.user.email,
      username: res.user.username,
      role: res.user.role,
      mustChangePassword: res.user.mustChangePassword,
    }
    setState({
      status: "authenticated",
      token: res.accessToken,
      user,
    })
    return user
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState({ status: "anonymous", token: null, user: null })
  }, [])

  const changePassword = useCallback(
    async (input: { currentPassword: string; newPassword: string }) => {
      if (state.status !== "authenticated") return
      await changePasswordApi(state.token, input)
      const user = await getProfile(state.token)
      setState({ status: "authenticated", token: state.token, user })
    },
    [state],
  )

  const value = useMemo<AuthContextValue>(() => {
    return {
      ...state,
      signIn,
      signOut,
      refreshProfile,
      changePassword,
    }
  }, [changePassword, refreshProfile, signIn, signOut, state])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
