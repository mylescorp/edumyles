"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/convex/_generated/api";
import {
  Download,
  FileText,
  Clock,
  CheckCircle,
  Loader2,
  Users,
  Building2,
  Headphones,
  TrendingUp,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type ExportType = "users" | "tenants" | "tickets" | "deals" | "analytics";

const EXPORT_TYPES = [
  { value: "users", label: "Users", icon: Users, description: "Export all platform users" },
  { value: "tenants", label: "Tenants", icon: Building2, description: "Export all tenant data" },
  { value: "tickets", label: "Tickets", icon: Headphones, description: "Export support tickets" },
  { value: "deals", label: "CRM Deals", icon: TrendingUp, description: "Export CRM pipeline deals" },
  { value: "analytics", label: "Analytics", icon: BarChart3, description: "Export analytics data" },
];

export default function DataExportPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [selectedType, setSelectedType] = useState<ExportType | "">("");
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, startRefreshing] = useTransition();

  const exports = usePlatformQuery(
    api.platform.dataExport.queries.listExports,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const createExport = useMutation(api.platform.dataExport.mutations.createExport);

  const handleExport = async () => {
    if (!sessionToken || !selectedType) return;
    setIsExporting(true);
    try {
      await createExport({
        sessionToken,
        exportType: selectedType,
        format: selectedFormat as any,
        filters: {},
      });
      toast.success("Export started.");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = (exp: any) => {
    if (exp.fileUrl) {
      window.open(exp.fileUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (exp.dataContent) {
      const mimeType = exp.format === "json" ? "application/json" : "text/csv";
      const blob = new Blob([exp.dataContent], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${exp.exportType}-export.${exp.format}`;
      link.click();
      window.URL.revokeObjectURL(url);
      return;
    }
    toast.error("This export is complete, but no downloadable file is attached yet.");
  };

  if (exports === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Data Export"
        description="Export platform data and download completed export payloads."
        actions={
          <Button variant="outline" onClick={() => startRefreshing(() => router.refresh())} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">New Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Export Type</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value as ExportType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data to export" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleExport}
                disabled={!selectedType || isExporting}
              >
                {isExporting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exporting...</>
                ) : (
                  <><Download className="h-4 w-4 mr-2" /> Start Export</>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Exports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {EXPORT_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div key={type.value} className="flex items-center gap-3 p-2 rounded-lg border">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export History</CardTitle>
            </CardHeader>
            <CardContent>
              {exports.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No exports yet"
                  description="Create the first platform export to start building your audit-friendly export history."
                  className="py-8"
                />
              ) : (
                <div className="space-y-3">
                  {exports.map((exp: any) => (
                    <div key={exp._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {exp.status === "completed" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : exp.status === "processing" ? (
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium capitalize">{exp.exportType} Export</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(exp.createdAt).toLocaleString()} · {exp.format?.toUpperCase()}
                            {exp.rowCount ? ` · ${exp.rowCount} rows` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={exp.status === "completed" ? "default" : "secondary"}>
                          {exp.status}
                        </Badge>
                        {exp.status === "completed" && (
                          <Button variant="outline" size="sm" onClick={() => handleDownload(exp)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
