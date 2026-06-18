import { memo } from "react"
import { format } from "date-fns"

import { ShimmerContainer, TableRowsShimmer } from "@/components/common/query-shimmer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AuditLog, Office } from "@/modules/api/types"

const OfficeTableRow = memo(function OfficeTableRow({ office }: { office: Office }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{office.name}</TableCell>
      <TableCell>
        <Badge variant="outline">{office.type}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{office.tehsilName ?? "—"}</TableCell>
    </TableRow>
  )
})

type OfficesTableCardProps = {
  offices?: Office[]
  error?: string | null
  isInitialLoading?: boolean
  isRefreshing?: boolean
}

export const OfficesTableCard = memo(function OfficesTableCard({
  offices,
  error,
  isInitialLoading = false,
  isRefreshing = false,
}: OfficesTableCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Offices</CardTitle>
        <CardDescription>Head office, World Bank, and tehsil offices</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <ShimmerContainer
            isInitialLoading={isInitialLoading}
            isRefreshing={isRefreshing}
            shimmer={<TableRowsShimmer rows={6} columns={3} />}
          >
            <Table className="enterprise-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tehsil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offices?.map((office) => (
                  <OfficeTableRow key={office.id} office={office} />
                ))}
              </TableBody>
            </Table>
          </ShimmerContainer>
        )}
      </CardContent>
    </Card>
  )
})

const AuditLogTableRow = memo(function AuditLogTableRow({ log }: { log: AuditLog }) {
  return (
    <TableRow>
      <TableCell>
        <Badge variant="secondary">{log.action}</Badge>
      </TableCell>
      <TableCell>{log.actor.email}</TableCell>
      <TableCell className="text-muted-foreground">
        {log.resourceType}
        {log.resourceId ? ` · ${log.resourceId.slice(0, 8)}…` : ""}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {format(new Date(log.createdAt), "dd MMM yyyy HH:mm")}
      </TableCell>
    </TableRow>
  )
})

type AuditLogsTableCardProps = {
  items?: AuditLog[]
  total?: number
  limit?: number
  error?: string | null
  isInitialLoading?: boolean
  isRefreshing?: boolean
}

export const AuditLogsTableCard = memo(function AuditLogsTableCard({
  items,
  total,
  limit = 20,
  error,
  isInitialLoading = false,
  isRefreshing = false,
}: AuditLogsTableCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit trail</CardTitle>
        <CardDescription>
          Latest {limit} events
          {total !== undefined ? ` of ${total} total` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <ShimmerContainer
            isInitialLoading={isInitialLoading}
            isRefreshing={isRefreshing}
            shimmer={<TableRowsShimmer rows={6} columns={4} />}
          >
            <Table className="enterprise-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((log) => (
                  <AuditLogTableRow key={log.id} log={log} />
                ))}
              </TableBody>
            </Table>
          </ShimmerContainer>
        )}
      </CardContent>
    </Card>
  )
})
