import { memo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartAreaShimmer,
  ShimmerContainer,
} from "@/components/common/query-shimmer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type ActivityPoint = {
  date: string;
  events: number;
};

type DashboardActivityChartProps = {
  data: ActivityPoint[];
  isInitialLoading?: boolean;
  isRefreshing?: boolean;
};

export const DashboardActivityChart = memo(function DashboardActivityChart({
  data,
  isInitialLoading = false,
  isRefreshing = false,
}: DashboardActivityChartProps) {
  return (
    <Card className="shadow-sm lg:col-span-2">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="text-base font-semibold tracking-tight">
          Activity overview
        </CardTitle>
        <CardDescription>
          Audit events recorded over the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] pt-4">
        <ShimmerContainer
          className="h-full"
          isInitialLoading={isInitialLoading}
          isRefreshing={isRefreshing}
          shimmer={<ChartAreaShimmer />}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="auditGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                interval={4}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={32}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 500 }}
              />
              <Area
                type="monotone"
                dataKey="events"
                stroke="var(--chart-1)"
                fill="url(#auditGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ShimmerContainer>
      </CardContent>
    </Card>
  );
});

type DashboardAtAGlanceProps = {
  usersCount?: number;
  officesCount?: number;
  auditPageLabel?: string;
  isRefreshing?: boolean;
};

export const DashboardAtAGlance = memo(function DashboardAtAGlance({
  usersCount,
  officesCount,
  auditPageLabel,
  isRefreshing = false,
}: DashboardAtAGlanceProps) {
  const rows = [
    { label: "Users loaded", value: usersCount ?? "—" },
    { label: "Offices loaded", value: officesCount ?? "—" },
    { label: "Latest audit page", value: auditPageLabel ?? "—" },
  ];

  return (
    <Card
      className={
        isRefreshing ? "shadow-sm opacity-80 transition-opacity" : "shadow-sm"
      }
    >
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="text-base font-semibold tracking-tight">
          At a glance
        </CardTitle>
        <CardDescription>System data summary</CardDescription>
      </CardHeader>
      <CardContent className="space-y-0 pt-2">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={
              index < rows.length - 1
                ? "flex items-center justify-between border-b border-border/60 py-3 text-sm"
                : "flex items-center justify-between py-3 text-sm"
            }
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-semibold tabular-nums">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});
