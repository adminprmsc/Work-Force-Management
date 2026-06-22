import { Navigate, Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "@/modules/auth/protected-route"
import { ChangePasswordPage } from "@/pages/change-password-page"
import { LoginPage } from "@/pages/login-page"
import { DashboardRouter } from "@/pages/dashboard-router"
import { DashboardRoutes } from "@/pages/dashboard-routes"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardRoutes />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
