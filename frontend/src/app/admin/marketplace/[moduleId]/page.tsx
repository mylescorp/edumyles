"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
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
import { Separator } from "@/components/ui/separator";
import {
  Download,
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

const MODULE_FEATURES: Record<string, string[]> = {
  sis: [
    "Student records with full lifecycle management",
    "Bulk CSV import and export",
    "NEMIS number tracking",
    "Student photo uploads",
    "Guardian/parent linking",
    "Class and stream assignment",
  ],
  admissions: [
    "Online application forms",
    "Application pipeline (submitted > reviewed > accepted > enrolled)",
    "Document upload and verification",
    "Auto-generate admission numbers",
    "Waiting list management",
    "Enrollment fee collection",
  ],
  finance: [
    "Fee structure builder per class/term",
    "Invoice generation (individual & bulk)",
    "M-Pesa STK Push payments",
    "Stripe and Airtel Money support",
    "PDF receipt generation",
    "Aging reports and collection tracking",
    "Fee reminder SMS/email automation",
  ],
  academics: [
    "Multi-curriculum grading (CBC, 8-4-4, IGCSE, GPA)",
    "Grade entry by teachers per subject",
    "Report card PDF generation with school branding",
    "Exam schedule management",
    "Assignment creation and submission tracking",
    "Offline grade entry with sync",
  ],
  timetable: [
    "Visual timetable builder",
    "Conflict detection (teacher/room double-booking)",
    "Period templates for CBC and 8-4-4",
    "Substitute teacher assignment",
    "Class, teacher, and room schedule views",
  ],
  communications: [
    "SMS via Africa's Talking",
    "Email via Resend",
    "In-app notifications",
    "Announcement system",
    "Emergency broadcasts with acknowledgment",
    "SMS quota per subscription tier",
  ],
  hr: [
    "Staff records and contract management",
    "Leave management with approval workflow",
    "Payroll with Kenya statutory deductions (PAYE, NSSF, SHIF)",
    "Payslip PDF generation",
    "Finance Officer approval before disbursement",
    "KEMIS export",
  ],
  library: [
    "Book catalogue with ISBN lookup",
    "Borrowing and return tracking",
    "Overdue fines (auto-charged to eWallet)",
    "Low stock alerts",
    "Librarian dashboard",
  ],
  transport: [
    "Route and stop management",
    "Vehicle fleet tracking",
    "Student-to-route assignment",
    "Transport fee billing integration",
    "Real-time arrival/departure notifications",
  ],
  ewallet: [
    "Digital wallet for students and parents",
    "Top-up via M-Pesa, Airtel Money, card",
    "Spend on fees, canteen, library fines, events",
    "Ledger-based balance tracking",
    "Transaction history with receipts",
    "Low balance SMS alerts",
  ],
  ecommerce: [
    "Per-school shop for uniforms, books, stationery",
    "Product listings with images and stock tracking",
    "Checkout via eWallet or direct M-Pesa",
    "Order management and tracking",
    "Revenue goes directly to school account",
  ],
};

export default function ModuleDetailPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const { isLoading: authLoading } = useAuth();
  const { tenantId, isLoading: tenantLoading } = useTenant();

  const moduleDetails = useQuery(
    api.modules.marketplace.queries.getModuleDetails,
    { moduleId }
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
  const features = MODULE_FEATURES[moduleId] ?? [];
  const isInstalled = !!moduleDetails.installed;

  const handleAction = (action: "install" | "uninstall") => {
    setDialogAction(action);
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!tenantId) return;
    setIsProcessing(true);
    try {
      if (dialogAction === "install") {
        await installModule({ tenantId, moduleId });
      } else {
        await uninstallModule({ tenantId, moduleId });
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Module operation failed:", error);
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
          isInstalled ? (
            <Button
              variant="outline"
              onClick={() => handleAction("uninstall")}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Uninstall
            </Button>
          ) : moduleDetails.availableForTier ? (
            <Button onClick={() => handleAction("install")}>
              <Download className="mr-2 h-4 w-4" />
              Install Module
            </Button>
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
                {features.map((feature, i) => (
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
                <span className="text-muted-foreground">Version</span>
                <span className="font-mono text-xs">{moduleDetails.version}</span>
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
