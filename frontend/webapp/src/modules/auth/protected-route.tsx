import { Navigate, useLocation } from "react-router-dom"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "./use-auth"
import { Role, roleToDashboardPath } from "./roles"

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: Role[]
}) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === "loading") {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Loading session…
        </div>
      </main>
    )
  }

  if (auth.status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles && !allowedRoles.includes(auth.user.role)) {
    return <Navigate to={roleToDashboardPath(auth.user.role)} replace />
  }

  return <>{children}</>
}

