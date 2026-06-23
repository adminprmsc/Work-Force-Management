import { Navigate, Route, Routes } from "react-router-dom"

import { DashboardLayout } from "@/components/app/dashboard-layout"
import { ProtectedRoute } from "@/modules/auth/protected-route"
import { Role } from "@/modules/auth/roles"
import { AuditLogsPage } from "@/pages/audit/audit-logs-page"
import { GeographyPage } from "@/pages/geography/geography-page"
import { RoleOverviewPage } from "@/pages/overview/role-overview-page"
import { OfficesPage } from "@/pages/offices/offices-page"
import { ConsultantsPage } from "@/pages/procurement/consultants-page"
import { ContractorsPage } from "@/pages/procurement/contractors-page"
import { ProcurementPackagesPage } from "@/pages/procurement/packages-page"
import { ProfilePage } from "@/pages/profile/profile-page"
import { SeniorManagerOverviewPage } from "@/pages/senior-manager/overview-page"
import { MySurveysPage } from "@/pages/survey/my-surveys-page"
import { FormDashboardPage } from "@/pages/survey/form-dashboard-page"
import { FormDashboardsIndexPage } from "@/pages/survey/form-dashboards-index-page"
import { SurveyFormsPage } from "@/pages/survey/survey-forms-page"
import { SurveyResponsesPage } from "@/pages/survey/survey-responses-page"
import { UsersPage } from "@/pages/users/users-page"

export function DashboardRoutes() {
  return (
    <Routes>
      <Route
        path="senior-manager"
        element={
          <ProtectedRoute allowedRoles={[Role.SENIOR_MANAGER_ES]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SeniorManagerOverviewPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="offices" element={<OfficesPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="geography" element={<GeographyPage />} />
        <Route path="procurement/packages" element={<ProcurementPackagesPage />} />
        <Route path="procurement/contractors" element={<ContractorsPage />} />
        <Route path="procurement/consultants" element={<ConsultantsPage />} />
        <Route path="surveys" element={<SurveyFormsPage />} />
        <Route path="surveys/responses" element={<SurveyResponsesPage />} />
        <Route path="form-dashboards" element={<FormDashboardsIndexPage />} />
        <Route path="form-dashboards/:formId" element={<FormDashboardPage />} />
      </Route>

      <Route
        path="ra-environment"
        element={
          <ProtectedRoute allowedRoles={[Role.RA_ENVIRONMENT_HO]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleOverviewPage />} />
        <Route path="procurement/packages" element={<ProcurementPackagesPage />} />
        <Route path="procurement/contractors" element={<ContractorsPage />} />
        <Route path="procurement/consultants" element={<ConsultantsPage />} />
        <Route path="surveys" element={<SurveyFormsPage />} />
        <Route path="surveys/responses" element={<SurveyResponsesPage />} />
        <Route path="form-dashboards" element={<FormDashboardsIndexPage />} />
        <Route path="form-dashboards/:formId" element={<FormDashboardPage />} />
        <Route path="geography" element={<GeographyPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route
        path="world-bank"
        element={
          <ProtectedRoute allowedRoles={[Role.WORLD_BANK_USER]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="procurement/packages" replace />} />
        <Route path="procurement/packages" element={<ProcurementPackagesPage />} />
        <Route path="form-dashboards" element={<FormDashboardsIndexPage />} />
        <Route path="form-dashboards/:formId" element={<FormDashboardPage />} />
        <Route
          path="*"
          element={
            <Navigate to="/dashboard/world-bank/procurement/packages" replace />
          }
        />
      </Route>

      <Route
        path="ra-tehsil"
        element={
          <ProtectedRoute allowedRoles={[Role.RA_ES_TEHSIL]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleOverviewPage />} />
        <Route path="procurement/packages" element={<ProcurementPackagesPage />} />
        <Route path="surveys" element={<MySurveysPage />} />
        <Route path="geography" element={<GeographyPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
