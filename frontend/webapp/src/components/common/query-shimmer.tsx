import { memo, type ReactNode } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type ShimmerContainerProps = {
  isInitialLoading?: boolean
  isRefreshing?: boolean
  shimmer: ReactNode
  children: ReactNode
  className?: string
}

export const ShimmerContainer = memo(function ShimmerContainer({
  isInitialLoading = false,
  isRefreshing = false,
  shimmer,
  children,
  className,
}: ShimmerContainerProps) {
  if (isInitialLoading) {
    return <>{shimmer}</>
  }

  return (
    <div className={cn("relative", className)}>
      {children}
      {isRefreshing ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit]"
        >
          <div className="absolute inset-0 bg-background/55 backdrop-blur-[1px]" />
          <div className="absolute inset-0 animate-pulse bg-muted/25" />
          <div className="absolute inset-y-0 -left-full w-full animate-[shimmer-slide_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-background/70 to-transparent" />
        </div>
      ) : null}
    </div>
  )
})

export const TableRowsShimmer = memo(function TableRowsShimmer({
  rows = 5,
  columns = 4,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn("h-8 flex-1", colIndex === 0 ? "max-w-[28%]" : "")}
            />
          ))}
        </div>
      ))}
    </div>
  )
})

export const StatValueShimmer = memo(function StatValueShimmer() {
  return <Skeleton className="h-8 w-16" aria-hidden />
})

export const ChartAreaShimmer = memo(function ChartAreaShimmer() {
  return (
    <div className="flex h-full flex-col justify-end gap-2" aria-hidden>
      <div className="flex h-full items-end gap-2">
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton
            key={index}
            className="flex-1 rounded-t-md"
            style={{ height: `${35 + ((index * 17) % 45)}%` }}
          />
        ))}
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  )
})

export const ListItemsShimmer = memo(function ListItemsShimmer({
  items = 6,
}: {
  items?: number
}) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: items }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  )
})

export const SelectFieldShimmer = memo(function SelectFieldShimmer() {
  return <Skeleton className="h-9 w-full max-w-xs" aria-hidden />
})

export const ProfileCardShimmer = memo(function ProfileCardShimmer() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
})
