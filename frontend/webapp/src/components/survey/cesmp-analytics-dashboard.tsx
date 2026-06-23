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
  Cloud,
  HardHat,
  MapPinned,
  Package,
  Shield,
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
import type {
  CesmpFormInsights,
  CesmpPatternInsight,
} from "@/modules/api/survey-types"

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

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
}: {
  title: string
  description: string
  insight: CesmpPatternInsight
  icon: React.ReactNode
  riskHint?: string
}) {
  const rows = useMemo(() => patternRows(insight), [insight])
  const chartConfig = useMemo(
    () =>
      Object.fromEntries(
        rows.map((row, index) => [
          row.name,
          { label: row.name, color: CHART_COLORS[index % CHART_COLORS.length] },
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
                  {rows.map((row, index) => (
                    <Cell
                      key={row.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="space-y-2">
              {rows.map((row, index) => (
                <div key={row.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{row.name}</span>
                    <span className="font-medium tabular-nums">
                      {row.count} ({row.pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${row.pct}%`,
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
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

function deriveRiskHints(insights: CesmpFormInsights) {
  const hints: string[] = []
  const ppe = patternRows(insights.ppeCompliance.wearingRate)
  const lowPpe = ppe.find((row) =>
    ["none", "some"].includes(row.name.toLowerCase()),
  )
  if (lowPpe && lowPpe.pct >= 25) {
    hints.push(
      `PPE compliance risk: ${lowPpe.pct}% of visits report "${lowPpe.name}" workers wearing appropriate PPE.`,
    )
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
    hints.push(
      `Dust exposure elevated on ${highDust.pct}% of visits — prioritize water sprinkling and dust suppression.`,
    )
  }
  if (weakControl && weakControl.pct >= 30) {
    hints.push(
      `Dust control gap: sprinkling is "${weakControl.name}" on ${weakControl.pct}% of visits.`,
    )
  }

  if (insights.budget.overallUtilizationRate >= 85) {
    hints.push(
      `ESMP budget is ${insights.budget.overallUtilizationRate}% utilized — review remaining headroom before new commitments.`,
    )
  }

  if (
    insights.summary.hseStaffHiredRate < 100 &&
    insights.summary.totalProcurementPackages > 0
  ) {
    hints.push(
      `Only ${insights.summary.hseStaffHiredRate}% of packages report HSE staff hired in baseline.`,
    )
  }

  return hints
}

type CesmpAnalyticsDashboardProps = {
  insights: CesmpFormInsights
  selectedPackageId: string | null
}

export function CesmpAnalyticsDashboard({
  insights,
  selectedPackageId,
}: CesmpAnalyticsDashboardProps) {
  const riskHints = useMemo(() => deriveRiskHints(insights), [insights])

  const budgetHeadData = [
    { head: "PPE", amount: insights.budget.byHead.ppe },
    { head: "HSE", amount: insights.budget.byHead.hse },
    {
      head: "Monitoring",
      amount: insights.budget.byHead.environmentalMonitoring,
    },
  ]

  const budgetChartConfig = {
    amount: { label: "Spend (PKR)", color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig

  const visiblePackages = selectedPackageId
    ? insights.packages.filter((pkg) => pkg.packageId === selectedPackageId)
    : insights.packages

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          C-ESMP stakeholder intelligence
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Executive KPIs for environmental safeguards, budget utilization, and
          field compliance — use package filter above to scope decisions.
        </p>
        {riskHints.length > 0 ? (
          <ul className="mt-3 space-y-1.5 text-sm">
            {riskHints.map((hint) => (
              <li key={hint} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <span>{hint}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

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

      <div className="grid gap-6 xl:grid-cols-2">
        <PatternAnalysisCard
          title="PPE compliance"
          description="Worker PPE wearing rate across site visits"
          insight={insights.ppeCompliance.wearingRate}
          icon={<Shield className="size-4" />}
        />
        <PatternAnalysisCard
          title="PPE condition & fit"
          description="Whether PPE is in good condition and properly fitted"
          insight={insights.ppeCompliance.goodCondition}
          icon={<Shield className="size-4" />}
        />
        <PatternAnalysisCard
          title="Noise pattern"
          description="Average noise level observed during inspections"
          insight={insights.noise.level}
          icon={<Wind className="size-4" />}
        />
        <PatternAnalysisCard
          title="Noise reduction measures"
          description="Frequency of machinery noise reduction integration"
          insight={insights.noise.reductionMeasures}
          icon={<Wind className="size-4" />}
        />
        <PatternAnalysisCard
          title="Dust emission pattern"
          description="Fugitive dust levels reported at construction sites"
          insight={insights.dust.level}
          icon={<Cloud className="size-4" />}
          riskHint="High or extreme dust on multiple visits may require immediate mitigation."
        />
        <PatternAnalysisCard
          title="Dust reduction measures"
          description="Water sprinkling frequency for dust control"
          insight={insights.dust.reductionMeasures}
          icon={<Cloud className="size-4" />}
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
