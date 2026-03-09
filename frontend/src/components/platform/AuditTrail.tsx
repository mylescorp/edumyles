"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter } from "lucide-react";
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
    const rows = filteredLogs.map(log => [
      log.timestamp,
      log.action,
      log.actorId,
      log.tenantId,
      JSON.stringify(log.details || '')
    ]);
    
    const csvContent = 'Timestamp,Action,Actor,Tenant ID,Details\n' + 
      rows.map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action: string) => {
    const colors = {
      'created': 'bg-success-bg text-success',
      'updated': 'bg-info-bg text-info',
      'deleted': 'bg-danger-bg text-danger',
      'suspended': 'bg-em-accent/10 text-em-accent-dark',
      'impersonation.started': 'bg-[#EDE9FE] text-role-student',
      'impersonation.ended': 'bg-[#E0E7FF] text-info',
      'login': 'bg-muted text-muted-foreground',
      'logout': 'bg-muted text-muted-foreground'
    };
    return colors[action as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg border">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
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
      <div className="text-sm text-muted-foreground">
        {filteredLogs.length} audit logs found
      </div>
    </div>
  );
}
