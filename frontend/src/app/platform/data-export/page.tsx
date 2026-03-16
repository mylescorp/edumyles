"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation } from "convex/react";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { api } from "../../../../../convex/_generated/api";
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
} from "lucide-react";

const EXPORT_TYPES = [
  { value: "users", label: "Users", icon: Users, description: "Export all platform users" },
  { value: "tenants", label: "Tenants", icon: Building2, description: "Export all tenant data" },
  { value: "tickets", label: "Tickets", icon: Headphones, description: "Export support tickets" },
  { value: "deals", label: "CRM Deals", icon: TrendingUp, description: "Export CRM pipeline deals" },
  { value: "analytics", label: "Analytics", icon: BarChart3, description: "Export analytics data" },
];

export default function DataExportPage() {
  const { sessionToken } = useAuth();
  const [selectedType, setSelectedType] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [isExporting, setIsExporting] = useState(false);

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
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Data Export" description="Export your platform data in various formats" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">New Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Export Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
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
              {!exports ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : exports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No exports yet. Create your first export above.</p>
                </div>
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
                          <Button variant="outline" size="sm">
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
