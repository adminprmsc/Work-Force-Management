import { memo, useMemo } from "react";
import { format, subDays } from "date-fns";
import { ClipboardList, Inbox, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

import {
  DashboardActivityChart,
  DashboardAtAGlance,
} from "@/components/dashboard/dashboard-overview";
import {
  AuditStatCard,
  OfficesStatCard,
  UsersStatCard,
} from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { useSeniorManagerDashboardData } from "@/hooks/use-senior-manager-dashboard";
import { surveyFormsPath, surveyResponsesPath } from "@/lib/survey";
import { cn } from "@/lib/utils";
import { Role } from "@/modules/auth/roles";

function buildActivitySeries(
  items: { createdAt: string }[] | undefined,
  days = 30,
) {
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = subDays(new Date(), days - 1 - i);
    buckets.set(format(d, "MMM d"), 0);
  }

  for (const item of items ?? []) {
    const key = format(new Date(item.createdAt), "MMM d");
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([date, events]) => ({
    date,
    events,
  }));
}

export const SeniorManagerOverviewPage = memo(
  function SeniorManagerOverviewPage() {
    // const auth = useAuth();
    const {
      usersQuery,
      officesQuery,
      auditQuery,
      usersView,
      officesView,
      auditView,
      combinedView,
      refreshAll,
    } = useSeniorManagerDashboardData();

    const activitySeries = useMemo(
      () => buildActivitySeries(auditQuery.data?.items),
      [auditQuery.data?.items],
    );

    const auditPageLabel = auditQuery.data
      ? `${auditQuery.data.page} / ${Math.ceil(auditQuery.data.total / auditQuery.data.limit)}`
      : undefined;

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-xl border border-border/80 bg-card px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Senior Manager Dashboard
            </p>
            {/* <h2 className="mt-1 text-xl font-semibold tracking-tight">
              {auth.status === "authenticated"
                ? auth.user.username
                : "Overview"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              System-wide users, offices, and audit activity
            </p> */}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => void refreshAll()}
            disabled={combinedView.isRefreshing}
          >
            <RefreshCw
              className={cn(
                "mr-2 size-4",
                combinedView.isRefreshing && "animate-spin",
              )}
            />
            {combinedView.isRefreshing ? "Refreshing…" : "Refresh data"}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <UsersStatCard
            count={usersQuery.data?.length}
            isInitialLoading={usersView.isInitialLoading}
            isRefreshing={usersView.isRefreshing}
          />
          <OfficesStatCard
            count={officesQuery.data?.length}
            isInitialLoading={officesView.isInitialLoading}
            isRefreshing={officesView.isRefreshing}
          />
          <AuditStatCard
            count={auditQuery.data?.total}
            isInitialLoading={auditView.isInitialLoading}
            isRefreshing={auditView.isRefreshing}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={surveyFormsPath(Role.SENIOR_MANAGER_ES)}>
              <ClipboardList className="mr-2 size-4" />
              Survey forms
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={surveyResponsesPath(Role.SENIOR_MANAGER_ES)}>
              <Inbox className="mr-2 size-4" />
              Survey responses
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <DashboardActivityChart
            data={activitySeries}
            isInitialLoading={auditView.isInitialLoading}
            isRefreshing={auditView.isRefreshing}
          />
          <DashboardAtAGlance
            usersCount={usersQuery.data?.length}
            officesCount={officesQuery.data?.length}
            auditPageLabel={auditPageLabel}
            isRefreshing={combinedView.isRefreshing}
          />
        </div>
      </div>
    );
  },
);
