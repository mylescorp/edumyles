"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { TierBadge } from "../components/TierBadge";
import { ModuleStatusBadge } from "../components/ModuleStatusBadge";
import { InstallDialog } from "../components/InstallDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Download,
  ExternalLink,
  Trash2,
  GraduationCap,
  ClipboardList,
  DollarSign,
  BookOpen,
  Calendar,
  MessageSquare,
  UserCog,
  Library,
  Bus,
  Wallet,
  ShoppingCart,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

const CORE_MODULE_IDS = ["sis", "communications", "users"];

const MODULE_ICONS: Record<string, LucideIcon> = {
  sis: GraduationCap,
  admissions: ClipboardList,
  finance: DollarSign,
  academics: BookOpen,
  timetable: Calendar,
  communications: MessageSquare,
  hr: UserCog,
  library: Library,
  transport: Bus,
  ewallet: Wallet,
  ecommerce: ShoppingCart,
};

export default function ModuleDetailPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const { isLoading: authLoading, sessionToken } = useAuth();
  const { tenantId, isLoading: tenantLoading } = useTenant();

  const moduleDetails = useQuery(
    api.modules.marketplace.queries.getModuleDetails,
    sessionToken ? { sessionToken, moduleId } : "skip"
  );

  const installModule = useMutation(api.modules.marketplace.mutations.installModule);
  const uninstallModule = useMutation(api.modules.marketplace.mutations.uninstallModule);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"install" | "uninstall">("install");
  const [isProcessing, setIsProcessing] = useState(false);

  if (authLoading || tenantLoading || moduleDetails === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!moduleDetails) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Module not found.</p>
      </div>
    );
  }

  const Icon = MODULE_ICONS[moduleId] ?? BookOpen;
  const features = moduleDetails.features ?? [];
  const isInstalled = !!moduleDetails.installed;
  const isCore = Boolean(moduleDetails.isCore || CORE_MODULE_IDS.includes(moduleId));

  const handleAction = (action: "install" | "uninstall") => {
    setDialogAction(action);
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!tenantId || !sessionToken) return;
    setIsProcessing(true);
    try {
      if (dialogAction === "install") {
        await installModule({ sessionToken, tenantId, moduleId });
        toast.success("Module installed");
      } else {
        await uninstallModule({ sessionToken, tenantId, moduleId });
        toast.success("Module uninstalled");
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Module operation failed:", error);
      toast.error(error instanceof Error ? error.message : "Module operation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={moduleDetails.name}
        description={moduleDetails.description}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Marketplace", href: "/admin/marketplace" },
          { label: moduleDetails.name },
        ]}
        actions={
          isInstalled && !isCore ? (
            <Button
              variant="outline"
              onClick={() => handleAction("uninstall")}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Uninstall
            </Button>
          ) : isCore ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline">Core Module</Badge>
              {moduleDetails.documentation && (
                <Button variant="outline" asChild>
                  <a href={moduleDetails.documentation} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Docs
                  </a>
                </Button>
              )}
            </div>
          ) : moduleDetails.availableForTier ? (
            <div className="flex items-center gap-2">
              <Button onClick={() => handleAction("install")}>
                <Download className="mr-2 h-4 w-4" />
                Install Module
              </Button>
              {moduleDetails.documentation && (
                <Button variant="outline" asChild>
                  <a href={moduleDetails.documentation} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Docs
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <Button disabled variant="outline">
              Upgrade Required
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                Module Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <ModuleStatusBadge
                  status={isInstalled ? moduleDetails.installed!.status : "not_installed"}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Required Tier</span>
                <TierBadge tier={moduleDetails.tier} />
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your Tier</span>
                <TierBadge tier={moduleDetails.currentTier} />
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Category</span>
                <span className="capitalize font-medium">{moduleDetails.category}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dependencies</span>
                <span className="text-right">
                  {moduleDetails.dependencies?.length > 0
                    ? moduleDetails.dependencies.join(", ")
                    : "None"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <span className="font-mono text-xs">{moduleDetails.version}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pricing</span>
                <span>
                  {moduleDetails.pricing?.monthly
                    ? `${moduleDetails.pricing.currency} ${moduleDetails.pricing.monthly}/mo`
                    : "Included"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Support</span>
                <span>{moduleDetails.support?.email ?? "support@edumyles.com"}</span>
              </div>
              {isInstalled && moduleDetails.installed && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Installed</span>
                    <span className="text-xs">
                      {new Date(moduleDetails.installed.installedAt).toLocaleDateString("en-KE")}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <InstallDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        moduleName={moduleDetails.name}
        moduleId={moduleId}
        requiredTier={moduleDetails.tier}
        action={dialogAction}
        onConfirm={handleConfirm}
        isLoading={isProcessing}
      />
    </div>
  );
}
