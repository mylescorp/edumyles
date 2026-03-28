"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Inbox, Check, X } from "lucide-react";
import { formatRelativeTime } from "@/lib/formatters";

interface ModuleRequest {
  _id: string;
  userId: string;
  moduleId: string;
  moduleName?: string;
  requestedAt: number;
  status: string;
  reviewedBy?: string;
  reviewedAt?: number;
  notes?: string;
  reason?: string;
}

interface RequestListProps {
  requests: ModuleRequest[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  isLoading?: boolean;
}

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pending: { variant: "outline", label: "Pending" },
  approved: { variant: "default", label: "Approved" },
  rejected: { variant: "destructive", label: "Rejected" },
};

const DEFAULT_BADGE = STATUS_BADGE.pending;

export function RequestList({
  requests,
  onApprove,
  onReject,
  isLoading,
}: RequestListProps) {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No module requests"
        description="Module access requests from users will appear here."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User ID</TableHead>
          <TableHead>Module</TableHead>
          <TableHead>Requested</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => {
          const badge = (STATUS_BADGE[request.status] ?? DEFAULT_BADGE)!;
          return (
            <TableRow key={request._id}>
              <TableCell className="font-mono text-xs">
                {request.userId}
              </TableCell>
              <TableCell className="font-medium capitalize">
                <div>{request.moduleName ?? request.moduleId}</div>
                <div className="font-mono text-xs text-muted-foreground normal-case">{request.moduleId}</div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatRelativeTime(request.requestedAt)}
              </TableCell>
              <TableCell>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                {request.reason ?? "-"}
              </TableCell>
              <TableCell className="text-right">
                {request.status === "pending" && (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onApprove(request._id)}
                      disabled={isLoading}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReject(request._id)}
                      disabled={isLoading}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Reject
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
