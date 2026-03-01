"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "lucide-react";

export default function PlatformModuleEditPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const { isLoading: authLoading } = useAuth();

  const registry = useQuery(api.modules.marketplace.platform.getFullRegistry);
  const updateStatus = useMutation(api.modules.marketplace.platform.updateModuleStatus);
  const updateVersion = useMutation(api.modules.marketplace.platform.updateModuleVersion);
  const [isSaving, setIsSaving] = useState(false);
  const [editVersion, setEditVersion] = useState("");

  const mod = registry?.find((m) => m.moduleId === moduleId);

  // Sync version input with server data when module first loads or moduleId changes
  useEffect(() => {
    if (mod?.version) {
      setEditVersion(mod.version);
    }
  }, [mod?.version]);

  if (authLoading || registry === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!mod) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Module not found in registry.</p>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    setIsSaving(true);
    try {
      await updateStatus({
        moduleId,
        status: newStatus as "active" | "beta" | "deprecated",
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVersionSave = async () => {
    if (!editVersion || editVersion === mod.version) return;
    setIsSaving(true);
    try {
      await updateVersion({ moduleId, version: editVersion });
    } catch (error) {
      console.error("Failed to update version:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={mod.name}
        description={`Manage module: ${moduleId}`}
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: mod.name },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Module Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Module ID</Label>
              <p className="font-mono text-sm">{mod.moduleId}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-muted-foreground">Name</Label>
              <p className="text-sm font-medium">{mod.name}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm">{mod.description}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-muted-foreground">Category</Label>
              <p className="text-sm capitalize">{mod.category}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-muted-foreground">Required Tier</Label>
              <Badge variant="outline" className="capitalize">
                {mod.tier}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={mod.status}
                onValueChange={handleStatusChange}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">
                Deprecated modules cannot be installed by new tenants.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Version</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  value={editVersion}
                  onChange={(e) => setEditVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="font-mono"
                />
                <Button
                  onClick={handleVersionSave}
                  disabled={isSaving || editVersion === mod.version}
                  size="sm"
                >
                  <Save className="mr-1 h-4 w-4" />
                  Save
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Current: {mod.version}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
