"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database, RefreshCw } from "lucide-react";
import Link from "next/link";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  beta: "outline",
  deprecated: "destructive",
};

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  standard: "Standard",
  growth: "Growth",
  pro: "Pro",
  enterprise: "Enterprise",
};

export default function PlatformMarketplacePage() {
  const { isLoading: authLoading } = useAuth();

  const registry = useQuery(api.modules.marketplace.platform.getFullRegistry);
  const seedRegistry = useMutation(api.modules.marketplace.platform.seedModuleRegistry);
  const updateStatus = useMutation(api.modules.marketplace.platform.updateModuleStatus);

  const [isSeeding, setIsSeeding] = useState(false);
  const [updatingModule, setUpdatingModule] = useState<string | null>(null);

  if (authLoading || registry === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const result = await seedRegistry();
      console.log(`Seeded ${result.seeded} of ${result.total} modules`);
    } catch (error) {
      console.error("Seed failed:", error);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleStatusChange = async (moduleId: string, newStatus: string) => {
    setUpdatingModule(moduleId);
    try {
      await updateStatus({
        moduleId,
        status: newStatus as "active" | "beta" | "deprecated",
      });
    } catch (error) {
      console.error("Status update failed:", error);
    } finally {
      setUpdatingModule(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Module Registry"
        description="Manage the global module catalog available to all tenants"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace" },
        ]}
        actions={
          <Button onClick={handleSeed} disabled={isSeeding} variant="outline">
            <Database className="mr-2 h-4 w-4" />
            {isSeeding ? "Seeding..." : "Seed Registry"}
          </Button>
        }
      />

      {registry.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Registry Empty</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Click &quot;Seed Registry&quot; to populate the module catalog with all 11
              EduMyles modules.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Required Tier</TableHead>
                  <TableHead className="hidden lg:table-cell">Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(registry as any[]).map((mod) => (
                  <TableRow key={mod.moduleId}>
                    <TableCell>
                      <Link
                        href={`/platform/marketplace/${mod.moduleId}`}
                        className="font-medium hover:underline"
                      >
                        {mod.name}
                      </Link>
                      <p className="max-w-[200px] sm:max-w-[300px] truncate text-xs text-muted-foreground">
                        {mod.description}
                      </p>
                    </TableCell>
                    <TableCell className="capitalize text-sm hidden sm:table-cell">
                      {mod.category}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs capitalize">
                        {TIER_LABELS[mod.tier] ?? mod.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs hidden lg:table-cell">
                      {mod.version}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={mod.status}
                        onValueChange={(value) =>
                          handleStatusChange(mod.moduleId, value)
                        }
                        disabled={updatingModule === mod.moduleId}
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="beta">Beta</SelectItem>
                          <SelectItem value="deprecated">
                            Deprecated
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/platform/marketplace/${mod.moduleId}`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
