"use client";

import { useState, useMemo } from "react";
import { DataTable, Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter, Calendar } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface AuditLog {
  _id: string;
  tenantId: string;
  actorId: string;
  action: string;
  timestamp: number;
  details?: any;
}

interface AuditFilters {
  action: string;
  dateRange: string;
  userId: string;
  tenantId: string;
}

export function AuditTrail({ logs }: { logs: AuditLog[] }) {
  const [filters, setFilters] = useState<AuditFilters>({
    action: '',
    dateRange: '30d',
    userId: '',
    tenantId: ''
  });

  const filteredLogs = useMemo(() => {
    let filtered = logs;

    // Apply filters
    if (filters.action) {
      filtered = filtered.filter(log => 
        log.action?.toLowerCase().includes(filters.action.toLowerCase())
      );
    }

    if (filters.userId) {
      filtered = filtered.filter(log => 
        log.actorId?.toLowerCase().includes(filters.userId.toLowerCase())
      );
    }

    if (filters.tenantId) {
      filtered = filtered.filter(log => 
        log.tenantId?.toLowerCase().includes(filters.tenantId.toLowerCase())
      );
    }

    if (filters.dateRange) {
      const now = Date.now();
      const ranges = {
        '7d': now - (7 * 24 * 60 * 60 * 1000),
        '30d': now - (30 * 24 * 60 * 60 * 1000),
        '90d': now - (90 * 24 * 60 * 60 * 1000)
      };
      
      filtered = filtered.filter(log => 
        (log.timestamp || 0) >= (ranges[filters.dateRange as keyof typeof ranges] || 0)
      );
    }

    return filtered;
  }, [logs, filters]);

  const exportAuditData = () => {
    const csv = [
      'Timestamp,Action,Actor,Tenant ID,Details',
      ...filteredLogs.map(log => [
        log.timestamp,
        log.action,
        log.actorId,
        log.tenantId,
        JSON.stringify(log.details || '')
      ].map(row => `${row}`)
    ].join('\n');
    ];

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action: string) => {
    const colors = {
      'created': 'bg-green-500/10 text-green-700',
      'updated': 'bg-blue-500/10 text-blue-700',
      'deleted': 'bg-red-500/10 text-red-700',
      'suspended': 'bg-orange-500/10 text-orange-700',
      'impersonation.started': 'bg-purple-500/10 text-purple-700',
      'impersonation.ended': 'bg-indigo-500/10 text-indigo-700',
      'login': 'bg-gray-500/10 text-gray-700',
      'logout': 'bg-gray-500/10 text-gray-700'
    };
    return colors[action as keyof typeof colors] || 'bg-gray-500/10 text-gray-700';
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Time',
      sortable: true,
      cell: (log) => (
        <div className="text-xs text-muted-foreground">
          {formatDate(log.timestamp)}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      cell: (log) => (
        <Badge variant="outline" className={getActionColor(log.action)}>
          {log.action}
        </Badge>
      ),
    },
    {
      key: 'actorId',
      header: 'Actor',
      sortable: true,
      cell: (log) => (
        <span className="text-sm">{log.actorId}</span>
      ),
    },
    {
      key: 'tenantId',
      header: 'Tenant',
      sortable: true,
      cell: (log) => (
        <span className="text-sm">{log.tenantId}</span>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      sortable: false,
      cell: (log) => (
        <div className="text-xs max-w-xs">
          {log.details && typeof log.details === 'object' 
            ? JSON.stringify(log.details, null, 2)
            : String(log.details)
          }
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="impersonation.started">Impersonation Started</SelectItem>
                <SelectItem value="impersonation.ended">Impersonation Ended</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button onClick={exportAuditData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Data table */}
      <DataTable
        data={filteredLogs}
        columns={columns}
        searchable
        searchPlaceholder="Search audit logs..."
        searchKey={(log) => `${log.action} ${log.actorId} ${log.tenantId}`}
        emptyTitle="No audit logs found"
        emptyDescription="No audit logs match the current filters."
      />
    </div>
  );
}
