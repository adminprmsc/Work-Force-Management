import { memo } from "react"
import { Building2, ClipboardList, Users } from "lucide-react"

import { StatValueShimmer, ShimmerContainer } from "@/components/common/query-shimmer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatCardProps = {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  accentClassName?: string
  isInitialLoading?: boolean
  isRefreshing?: boolean
}

export const StatCard = memo(function StatCard({
  title,
  value,
  description,
  icon,
  accentClassName = "bg-primary/10 text-primary",
  isInitialLoading = false,
  isRefreshing = false,
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden shadow-sm">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary/70" />
      <CardHeader className="flex flex-row items-start justify-between pb-2 pl-5">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            accentClassName,
          )}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pl-5">
        <ShimmerContainer
          isInitialLoading={isInitialLoading}
          isRefreshing={isRefreshing}
          shimmer={<StatValueShimmer />}
        >
          <div
            className={cn(
              "text-3xl font-semibold tracking-tight transition-opacity",
              isRefreshing ? "opacity-70" : "opacity-100",
            )}
          >
            {value}
          </div>
        </ShimmerContainer>
        {description ? (
          <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  )
})

type CountStatCardProps = {
  count?: number
  isInitialLoading?: boolean
  isRefreshing?: boolean
}

export const UsersStatCard = memo(function UsersStatCard({
  count,
  isInitialLoading,
  isRefreshing,
}: CountStatCardProps) {
  return (
    <StatCard
      title="Users"
      value={count ?? 0}
      description="Registered accounts"
      icon={<Users className="size-4" />}
      accentClassName="bg-blue-500/10 text-blue-700 dark:text-blue-400"
      isInitialLoading={isInitialLoading}
      isRefreshing={isRefreshing}
    />
  )
})

export const OfficesStatCard = memo(function OfficesStatCard({
  count,
  isInitialLoading,
  isRefreshing,
}: CountStatCardProps) {
  return (
    <StatCard
      title="Offices"
      value={count ?? 0}
      description="Head office, World Bank & tehsil"
      icon={<Building2 className="size-4" />}
      accentClassName="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      isInitialLoading={isInitialLoading}
      isRefreshing={isRefreshing}
    />
  )
})

export const AuditStatCard = memo(function AuditStatCard({
  count,
  isInitialLoading,
  isRefreshing,
}: CountStatCardProps) {
  return (
    <StatCard
      title="Audit events"
      value={count ?? 0}
      description="Recent activity logged"
      icon={<ClipboardList className="size-4" />}
      accentClassName="bg-amber-500/10 text-amber-700 dark:text-amber-400"
      isInitialLoading={isInitialLoading}
      isRefreshing={isRefreshing}
    />
  )
})
