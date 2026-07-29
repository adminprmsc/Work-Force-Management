import { memo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PAGE_SIZE_OPTIONS,
  type PageSizeOption,
} from "@/lib/list-pagination"

type ListPaginationProps = {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: PageSizeOption) => void
  label?: string
}

export const ListPagination = memo(function ListPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  label = "results",
}: ListPaginationProps) {
  if (total <= 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-muted-foreground">
          Showing {from}–{to} of {total} {label}
        </p>
        {onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground" id="rows-per-page-label">
              Rows per page
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) =>
                onPageSizeChange(Number(value) as PageSizeOption)
              }
            >
              <SelectTrigger
                size="sm"
                className="w-[4.75rem]"
                aria-labelledby="rows-per-page-label"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" position="popper">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <span className="min-w-[4.5rem] text-center text-xs text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
})
