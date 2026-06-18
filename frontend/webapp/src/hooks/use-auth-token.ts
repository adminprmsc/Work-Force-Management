import { useAuth } from "@/modules/auth/use-auth"

export function useAuthToken() {
  const auth = useAuth()
  return auth.status === "authenticated" ? auth.token : null
}

