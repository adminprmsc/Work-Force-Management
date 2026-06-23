import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Cloud,
  HardHat,
  MapPinned,
  Package,
  Shield,
  ShieldAlert,
  TrendingUp,
  Users,
  Wind,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type {
  CesmpFormInsights,
  CesmpPatternInsight,
} from "@/modules/api/survey-types"
import {
  type ComplianceImpactKind,
  IMPACT_CHIP_CLASSES,
  IMPACT_LABELS,
  type ImpactTone,
  impactBarGradient,
  impactColorForComplianceLabel,
  impactToneForComplianceLabel,
} from "@/lib/impact-colors"

function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function patternRows(insight: CesmpPatternInsight) {
  return Object.entries(insight.counts)
    .map(([name, count]) => ({
      name,
      count,
      pct: insight.total > 0 ? Math.round((count / insight.total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

function PatternAnalysisCard({
  title,
  description,
  insight,
  icon,
  riskHint,
  impactKind,
}: {
  title: string
  description: string
  insight: CesmpPatternInsight
  icon: React.ReactNode
  riskHint?: string
  impactKind: ComplianceImpactKind
}) {
  const rows = useMemo(
    () =>
      Object.entries(insight.counts)
        .map(([name, count]) => ({
          name,
          count,
          pct: insight.total > 0 ? Math.round((count / insight.total) * 100) : 0,
          tone: impactToneForComplianceLabel(name, impactKind),
          color: impactColorForComplianceLabel(name, impactKind),
        }))
        .sort((a, b) => b.count - a.count),
    [impactKind, insight.counts, insight.total],
  )
  const chartConfig = useMemo(
    () =>
      Object.fromEntries(
        rows.map((row) => [
          row.name,
          { label: row.name, color: row.color },
        ]),
      ) satisfies ChartConfig,
    [rows],
  )

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {icon}
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Badge variant="outline">{insight.total} responses</Badge>
        </div>
        {riskHint ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>{riskHint}</span>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="pt-4">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No submitted data for this indicator yet.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[160px_1fr]">
            <ChartContainer
              config={chartConfig}
              className="mx-auto h-[160px] w-full max-w-[160px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={rows}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={38}
                  outerRadius={68}
                  paddingAngle={2}
                >
                  {rows.map((row) => (
                    <Cell key={row.name} fill={row.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.name} className="space-y-1">
                  <div className="flex justify-between gap-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="truncate text-muted-foreground">
                        {row.name}
                      </span>
                      <span
                        className={cn(
                          "hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium sm:inline",
                          IMPACT_CHIP_CLASSES[row.tone],
                        )}
                      >
                        {IMPACT_LABELS[row.tone]}
                      </span>
                    </div>
                    <span className="shrink-0 font-medium tabular-nums">
                      {row.count} ({row.pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${row.pct}%`,
                        background: impactBarGradient(row.color),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ImpactLegend() {
  const tones = ["positive", "neutral", "warning", "negative"] as const
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
      <span className="text-xs font-medium text-muted-foreground">
        Impact scale
      </span>
      {tones.map((tone) => (
        <span
          key={tone}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium",
            IMPACT_CHIP_CLASSES[tone],
          )}
        >
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: `var(--impact-${tone})` }}
          />
          {IMPACT_LABELS[tone]}
        </span>
      ))}
    </div>
  )
}

type IntelligenceAlert = {
  id: string
  severity: ImpactTone
  category: string
  metric: string
  detail: string
}

const ALERT_PANEL_CLASSES: Record<
  ImpactTone,
  { border: string; bg: string; iconClass: string }
> = {
  negative: {
    border: "border-l-[var(--impact-negative)]",
    bg: "bg-[color-mix(in_oklch,var(--impact-negative)_7%,var(--card))]",
    iconClass: "text-[var(--impact-negative)]",
  },
  warning: {
    border: "border-l-[var(--impact-warning)]",
    bg: "bg-[color-mix(in_oklch,var(--impact-warning)_8%,var(--card))]",
    iconClass: "text-[var(--impact-warning)]",
  },
  neutral: {
    border: "border-l-[var(--impact-neutral)]",
    bg: "bg-[color-mix(in_oklch,var(--impact-neutral)_8%,var(--card))]",
    iconClass: "text-[var(--impact-neutral)]",
  },
  positive: {
    border: "border-l-[var(--impact-positive)]",
    bg: "bg-[color-mix(in_oklch,var(--impact-positive)_8%,var(--card))]",
    iconClass: "text-[var(--impact-positive)]",
  },
}

function IntelligenceAlertCard({ alert }: { alert: IntelligenceAlert }) {
  const styles = ALERT_PANEL_CLASSES[alert.severity]

  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 border-l-4 p-4 shadow-sm",
        styles.border,
        styles.bg,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/80",
              styles.iconClass,
            )}
          >
            <ShieldAlert className="size-4" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {alert.category}
              </p>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-medium",
                  IMPACT_CHIP_CLASSES[alert.severity],
                )}
              >
                {IMPACT_LABELS[alert.severity]}
              </span>
            </div>
            <p className="text-sm font-medium leading-snug text-foreground">
              {alert.detail}
            </p>
          </div>
        </div>
        <p
          className={cn(
            "shrink-0 text-right text-lg font-semibold tabular-nums tracking-tight",
            styles.iconClass,
          )}
        >
          {alert.metric}
        </p>
      </div>
    </div>
  )
}

function StakeholderIntelligencePanel({
  alerts,
}: {
  alerts: IntelligenceAlert[]
}) {
  const criticalCount = alerts.filter((a) => a.severity === "negative").length

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <div className="border-b bg-gradient-to-r from-primary/8 via-primary/4 to-transparent px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-background shadow-sm">
              <Shield className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                C-ESMP stakeholder intelligence
              </p>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Executive briefing on environmental safeguards, budget utilization,
                and field compliance. Scope using the package and date filters above.
              </p>
            </div>
          </div>
          {alerts.length > 0 ? (
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 self-start px-2.5 py-1 text-xs font-semibold",
                criticalCount > 0
                  ? "border-[color-mix(in_oklch,var(--impact-negative)_35%,transparent)] bg-[color-mix(in_oklch,var(--impact-negative)_10%,transparent)] text-[var(--impact-negative)]"
                  : "border-[color-mix(in_oklch,var(--impact-warning)_35%,transparent)] bg-[color-mix(in_oklch,var(--impact-warning)_10%,transparent)] text-[var(--impact-warning)]",
              )}
            >
              {alerts.length} action item{alerts.length === 1 ? "" : "s"}
            </Badge>
          ) : null}
        </div>
      </div>

      <CardContent className="p-6">
        {alerts.length === 0 ? (
          <div className="flex items-start gap-4 rounded-lg border border-[color-mix(in_oklch,var(--impact-positive)_25%,transparent)] bg-[color-mix(in_oklch,var(--impact-positive)_8%,var(--card))] p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--impact-positive)_15%,transparent)] text-[var(--impact-positive)]">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                No critical compliance gaps in current scope
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Field indicators are within acceptable thresholds for the selected
                package and date window. Continue routine monitoring.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Priority findings
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              {alerts.map((alert) => (
                <IntelligenceAlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function deriveRiskHints(insights: CesmpFormInsights): IntelligenceAlert[] {
  const alerts: IntelligenceAlert[] = []
  const ppe = patternRows(insights.ppeCompliance.wearingRate)
  const lowPpe = ppe.find((row) =>
    ["none", "some"].includes(row.name.toLowerCase()),
  )
  if (lowPpe && lowPpe.pct >= 25) {
    alerts.push({
      id: "ppe-compliance",
      severity: lowPpe.pct >= 50 ? "negative" : "warning",
      category: "PPE compliance",
      metric: `${lowPpe.pct}%`,
      detail: `Visits report "${lowPpe.name}" workers wearing appropriate PPE — immediate contractor engagement recommended.`,
    })
  }

  const dust = patternRows(insights.dust.level)
  const highDust = dust.find((row) =>
    ["high dust", "extreme dust"].includes(row.name.toLowerCase()),
  )
  const dustControl = patternRows(insights.dust.reductionMeasures)
  const weakControl = dustControl.find((row) =>
    ["never", "rarely"].includes(row.name.toLowerCase()),
  )
  if (highDust && highDust.pct >= 20) {
    alerts.push({
      id: "dust-exposure",
      severity: highDust.pct >= 40 ? "negative" : "warning",
      category: "Dust exposure",
      metric: `${highDust.pct}%`,
      detail:
        "Visits report elevated fugitive dust — prioritize water sprinkling and dust suppression on site.",
    })
  }
  if (weakControl && weakControl.pct >= 30) {
    alerts.push({
      id: "dust-control",
      severity: "warning",
      category: "Dust control",
      metric: `${weakControl.pct}%`,
      detail: `Water sprinkling reported as "${weakControl.name}" — review dust mitigation frequency with contractors.`,
    })
  }

  if (insights.budget.overallUtilizationRate >= 85) {
    alerts.push({
      id: "budget-utilization",
      severity:
        insights.budget.overallUtilizationRate >= 95 ? "warning" : "neutral",
      category: "ESMP budget",
      metric: `${insights.budget.overallUtilizationRate}%`,
      detail:
        "Budget utilization is high — review remaining headroom before new ESMP commitments.",
    })
  }

  if (
    insights.summary.hseStaffHiredRate < 100 &&
    insights.summary.totalProcurementPackages > 0
  ) {
    alerts.push({
      id: "hse-staff",
      severity:
        insights.summary.hseStaffHiredRate < 50 ? "negative" : "warning",
      category: "HSE staffing",
      metric: `${insights.summary.hseStaffHiredRate}%`,
      detail: `Only ${insights.summary.hseStaffHiredPackages} of ${insights.summary.totalProcurementPackages} packages report HSE staff hired in baseline.`,
    })
  }

  return alerts
}

type CesmpAnalyticsDashboardProps = {
  insights: CesmpFormInsights
  selectedPackageId: string | null
}

export function CesmpAnalyticsDashboard({
  insights,
  selectedPackageId,
}: CesmpAnalyticsDashboardProps) {
  const riskAlerts = useMemo(() => deriveRiskHints(insights), [insights])

  const budgetHeadData = [
    { head: "PPE", amount: insights.budget.byHead.ppe },
    { head: "HSE", amount: insights.budget.byHead.hse },
    {
      head: "Monitoring",
      amount: insights.budget.byHead.environmentalMonitoring,
    },
  ]

  const budgetChartConfig = {
    amount: { label: "Spend (PKR)", color: "var(--chart-1)" },
  } satisfies ChartConfig

  const visiblePackages = selectedPackageId
    ? insights.packages.filter((pkg) => pkg.packageId === selectedPackageId)
    : insights.packages

  return (
    <div className="space-y-6">
      <StakeholderIntelligencePanel alerts={riskAlerts} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Contractors</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {insights.summary.totalContractors}
                </p>
              </div>
              <Building2 className="size-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Procurement packages</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {insights.summary.totalProcurementPackages}
                </p>
              </div>
              <Package className="size-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Village coverage</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {insights.summary.totalVillageCoverage}
                </p>
                <p className="text-xs text-muted-foreground">
                  {insights.summary.totalSiteVisitsSubmitted} site visits
                </p>
              </div>
              <MapPinned className="size-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">HSE staff hired</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {insights.summary.hseStaffHiredRate}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {insights.summary.hseStaffHiredPackages} of{" "}
                  {insights.summary.totalProcurementPackages} packages
                </p>
              </div>
              <HardHat className="size-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-border/80 shadow-sm xl:col-span-1">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4" />
              ESMP budget utilization
            </CardTitle>
            <CardDescription>Allocated vs utilized across scope</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border bg-muted/20 p-3">
                <dt className="text-muted-foreground">Allocated</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">
                  {formatCurrency(insights.budget.totalAllocated)}
                </dd>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <dt className="text-muted-foreground">Utilized</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-300">
                  {formatCurrency(insights.budget.totalUtilized)}
                </dd>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <dt className="text-muted-foreground">Remaining</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(insights.budget.totalRemaining)}
                </dd>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <dt className="text-muted-foreground">Utilization rate</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">
                  {insights.budget.overallUtilizationRate}%
                </dd>
              </div>
            </dl>
            <ChartContainer config={budgetChartConfig} className="h-[200px] w-full">
              <BarChart data={budgetHeadData} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="head" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={48} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm xl:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Procurement package ESMP profile</CardTitle>
            <CardDescription>
              Budget, contractor, HSE baseline, and village coverage per package
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="max-h-[360px] overflow-auto rounded-lg border">
              <Table className="enterprise-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Utilized</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Villages</TableHead>
                    <TableHead>HSE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiblePackages.map((pkg) => (
                    <TableRow key={pkg.packageId}>
                      <TableCell>
                        <div className="font-medium">{pkg.packageName}</div>
                        <div className="text-xs text-muted-foreground">
                          {pkg.tehsilName}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{pkg.contractorName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(pkg.budgetAllocated)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(pkg.budgetUtilized)}
                        <div className="text-xs text-muted-foreground">
                          {pkg.utilizationRate}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(pkg.budgetRemaining)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {pkg.villagesCovered}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            pkg.hseStaffHired === true
                              ? "default"
                              : pkg.hseStaffHired === false
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {pkg.hseStaffHired === true
                            ? "Hired"
                            : pkg.hseStaffHired === false
                              ? "Not hired"
                              : "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visiblePackages.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No package data in this scope.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ImpactLegend />

      <div className="grid gap-6 xl:grid-cols-2">
        <PatternAnalysisCard
          title="PPE compliance"
          description="Worker PPE wearing rate across site visits"
          insight={insights.ppeCompliance.wearingRate}
          icon={<Shield className="size-4" />}
          impactKind="ppe-wearing"
        />
        <PatternAnalysisCard
          title="PPE condition & fit"
          description="Whether PPE is in good condition and properly fitted"
          insight={insights.ppeCompliance.goodCondition}
          icon={<Shield className="size-4" />}
          impactKind="yes-no"
        />
        <PatternAnalysisCard
          title="Noise pattern"
          description="Average noise level observed during inspections"
          insight={insights.noise.level}
          icon={<Wind className="size-4" />}
          impactKind="noise-severity"
        />
        <PatternAnalysisCard
          title="Noise reduction measures"
          description="Frequency of machinery noise reduction integration"
          insight={insights.noise.reductionMeasures}
          icon={<Wind className="size-4" />}
          impactKind="mitigation-frequency"
        />
        <PatternAnalysisCard
          title="Dust emission pattern"
          description="Fugitive dust levels reported at construction sites"
          insight={insights.dust.level}
          icon={<Cloud className="size-4" />}
          riskHint="High or extreme dust on multiple visits may require immediate mitigation."
          impactKind="dust-severity"
        />
        <PatternAnalysisCard
          title="Dust reduction measures"
          description="Water sprinkling frequency for dust control"
          insight={insights.dust.reductionMeasures}
          icon={<Cloud className="size-4" />}
          impactKind="mitigation-frequency"
        />
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />
            Training & capacity building
          </CardTitle>
          <CardDescription>
            Field-reported trainings from village monitoring visits
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 lg:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">Visits with training</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {insights.training.responsesWithTraining}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">Total participants</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {insights.training.totalParticipants}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">Training venues used</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {Object.keys(insights.training.venues).length}
            </p>
          </div>
          <div className="lg:col-span-3">
            {insights.training.topTrainings.length > 0 ? (
              <div className="overflow-hidden rounded-lg border">
                <Table className="enterprise-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Training title</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Participants</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insights.training.topTrainings.map((row) => (
                      <TableRow key={row.title}>
                        <TableCell className="font-medium">{row.title}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.count}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.participants}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No training sessions recorded in submitted visits yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
