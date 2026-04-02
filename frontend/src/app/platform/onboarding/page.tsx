"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Rocket,
  CheckCircle,
  Circle,
  ChevronRight,
  ChevronLeft,
  Building2,
  UserCog,
  Layers,
  Palette,
  Database,
  ClipboardCheck,
  Search,
  RotateCcw,
  Play,
  AlertCircle,
  Clock,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { toast } from "sonner";

const ONBOARDING_STEPS = [
  { id: 0, label: "School Info", icon: Building2, description: "Basic school information and contact details" },
  { id: 1, label: "Admin Setup", icon: UserCog, description: "Configure the primary administrator account" },
  { id: 2, label: "Module Selection", icon: Layers, description: "Choose which modules to enable" },
  { id: 3, label: "Branding", icon: Palette, description: "Customize the look and feel" },
  { id: 4, label: "Data Import", icon: Database, description: "Import existing data (optional)" },
  { id: 5, label: "Review", icon: ClipboardCheck, description: "Review and finalize setup" },
];

interface OnboardingRecord {
  _id: string;
  tenantId: string;
  tenantName: string;
  tenantStatus?: string;
  currentStep: number;
  completedSteps: number[];
  status: "in_progress" | "completed" | "abandoned";
  startedAt: number;
  completedAt?: number;
  data: Record<string, any>;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    abandoned: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[status] ?? "bg-gray-100 text-gray-800"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function StepperIndicator({ currentStep, completedSteps }: { currentStep: number; completedSteps: number[] }) {
  return (
    <div className="flex items-center gap-1 w-full">
      {ONBOARDING_STEPS.map((step, idx) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const StepIcon = step.icon;
        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : isCurrent
                    ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950"
                    : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {isCompleted ? <CheckCircle className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
              </div>
              <span className={`text-xs mt-1 text-center ${isCurrent ? "font-semibold text-blue-600" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {idx < ONBOARDING_STEPS.length - 1 && (
              <div className={`h-0.5 w-full mt-[-16px] ${isCompleted ? "bg-green-500" : "bg-muted-foreground/20"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SchoolInfoForm({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="schoolName">School Name *</Label>
          <Input id="schoolName" value={data.schoolName ?? ""} onChange={(e) => onChange({ ...data, schoolName: e.target.value })} placeholder="e.g. Nairobi Academy" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="schoolType">School Type *</Label>
          <Select value={data.schoolType ?? ""} onValueChange={(v) => onChange({ ...data, schoolType: v })}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="k12">K-12</SelectItem>
              <SelectItem value="university">University</SelectItem>
              <SelectItem value="college">College</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Contact Email *</Label>
          <Input id="email" type="email" value={data.email ?? ""} onChange={(e) => onChange({ ...data, email: e.target.value })} placeholder="admin@school.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input id="phone" value={data.phone ?? ""} onChange={(e) => onChange({ ...data, phone: e.target.value })} placeholder="+254 700 000 000" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="county">County / State</Label>
          <Input id="county" value={data.county ?? ""} onChange={(e) => onChange({ ...data, county: e.target.value })} placeholder="Nairobi" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Input id="country" value={data.country ?? ""} onChange={(e) => onChange({ ...data, country: e.target.value })} placeholder="Kenya" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" value={data.address ?? ""} onChange={(e) => onChange({ ...data, address: e.target.value })} placeholder="Physical address" rows={2} />
      </div>
    </div>
  );
}

function AdminSetupForm({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="adminFirstName">First Name *</Label>
          <Input id="adminFirstName" value={data.adminFirstName ?? ""} onChange={(e) => onChange({ ...data, adminFirstName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminLastName">Last Name *</Label>
          <Input id="adminLastName" value={data.adminLastName ?? ""} onChange={(e) => onChange({ ...data, adminLastName: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="adminEmail">Admin Email *</Label>
          <Input id="adminEmail" type="email" value={data.adminEmail ?? ""} onChange={(e) => onChange({ ...data, adminEmail: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminPhone">Admin Phone</Label>
          <Input id="adminPhone" value={data.adminPhone ?? ""} onChange={(e) => onChange({ ...data, adminPhone: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="adminRole">Role *</Label>
        <Select value={data.adminRole ?? "school_admin"} onValueChange={(v) => onChange({ ...data, adminRole: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="school_admin">School Admin</SelectItem>
            <SelectItem value="principal">Principal</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ModuleSelectionForm({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const modules = [
    { id: "sis", name: "Student Information System", description: "Student records, enrollment, classes", core: true },
    { id: "academics", name: "Academics", description: "Grades, assignments, report cards", core: true },
    { id: "finance", name: "Finance & Fees", description: "Fee structures, invoicing, payments", core: false },
    { id: "hr", name: "HR & Payroll", description: "Staff management, contracts, payroll", core: false },
    { id: "communications", name: "Communications", description: "Announcements, messaging", core: false },
    { id: "admissions", name: "Admissions", description: "Application management", core: false },
    { id: "library", name: "Library", description: "Book catalog, borrowing", core: false },
    { id: "transport", name: "Transport", description: "Routes, vehicles, assignments", core: false },
    { id: "timetable", name: "Timetable", description: "Class scheduling", core: false },
    { id: "ewallet", name: "eWallet", description: "Student digital wallet", core: false },
    { id: "ecommerce", name: "eCommerce", description: "School shop", core: false },
  ];

  const selected: string[] = data.selectedModules ?? ["sis", "academics"];

  const toggleModule = (moduleId: string) => {
    const mod = modules.find((m) => m.id === moduleId);
    if (mod?.core) return; // Can't deselect core modules
    const next = selected.includes(moduleId)
      ? selected.filter((m) => m !== moduleId)
      : [...selected, moduleId];
    onChange({ ...data, selectedModules: next });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Select the modules to enable for this tenant. Core modules are always included.</p>
      <div className="grid grid-cols-2 gap-3">
        {modules.map((mod) => {
          const isSelected = selected.includes(mod.id);
          return (
            <div
              key={mod.id}
              onClick={() => toggleModule(mod.id)}
              className={`cursor-pointer rounded-lg border-2 p-3 transition-colors ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "border-muted hover:border-muted-foreground/50"
              } ${mod.core ? "opacity-90" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{mod.name}</span>
                {mod.core && <Badge variant="secondary" className="text-xs">Core</Badge>}
                {isSelected && !mod.core && <CheckCircle className="h-4 w-4 text-blue-500" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BrandingForm({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Primary Color</Label>
          <div className="flex gap-2">
            <Input id="primaryColor" type="color" value={data.primaryColor ?? "#3B82F6"} onChange={(e) => onChange({ ...data, primaryColor: e.target.value })} className="w-14 h-10 p-1" />
            <Input value={data.primaryColor ?? "#3B82F6"} onChange={(e) => onChange({ ...data, primaryColor: e.target.value })} className="flex-1" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondaryColor">Secondary Color</Label>
          <div className="flex gap-2">
            <Input id="secondaryColor" type="color" value={data.secondaryColor ?? "#10B981"} onChange={(e) => onChange({ ...data, secondaryColor: e.target.value })} className="w-14 h-10 p-1" />
            <Input value={data.secondaryColor ?? "#10B981"} onChange={(e) => onChange({ ...data, secondaryColor: e.target.value })} className="flex-1" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subdomain">Subdomain *</Label>
        <div className="flex items-center gap-2">
          <Input id="subdomain" value={data.subdomain ?? ""} onChange={(e) => onChange({ ...data, subdomain: e.target.value })} placeholder="myschool" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">.edumyles.com</span>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input id="logoUrl" value={data.logoUrl ?? ""} onChange={(e) => onChange({ ...data, logoUrl: e.target.value })} placeholder="https://..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="motto">School Motto</Label>
        <Input id="motto" value={data.motto ?? ""} onChange={(e) => onChange({ ...data, motto: e.target.value })} placeholder="Education is the key" />
      </div>
    </div>
  );
}

function DataImportForm({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">You can skip this step and import data later from the admin panel.</p>
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-dashed">
          <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
            <Database className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-sm">Students CSV</p>
            <p className="text-xs text-muted-foreground">Upload a CSV file with student records</p>
            <Button variant="outline" size="sm" className="mt-2">Choose File</Button>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-sm">Staff CSV</p>
            <p className="text-xs text-muted-foreground">Upload a CSV file with staff records</p>
            <Button variant="outline" size="sm" className="mt-2">Choose File</Button>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-2">
        <Label htmlFor="importNotes">Notes</Label>
        <Textarea
          id="importNotes"
          value={data.importNotes ?? ""}
          onChange={(e) => onChange({ ...data, importNotes: e.target.value })}
          placeholder="Any notes about the data import..."
          rows={3}
        />
      </div>
    </div>
  );
}

function ReviewStep({ allData }: { allData: Record<string, any> }) {
  const schoolInfo = allData.step_0 ?? {};
  const adminInfo = allData.step_1 ?? {};
  const moduleInfo = allData.step_2 ?? {};
  const brandingInfo = allData.step_3 ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-2">School Information</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Name:</span> {schoolInfo.schoolName || "Not set"}</div>
          <div><span className="text-muted-foreground">Type:</span> {schoolInfo.schoolType || "Not set"}</div>
          <div><span className="text-muted-foreground">Email:</span> {schoolInfo.email || "Not set"}</div>
          <div><span className="text-muted-foreground">Phone:</span> {schoolInfo.phone || "Not set"}</div>
          <div><span className="text-muted-foreground">Country:</span> {schoolInfo.country || "Not set"}</div>
          <div><span className="text-muted-foreground">County:</span> {schoolInfo.county || "Not set"}</div>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Administrator</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Name:</span> {adminInfo.adminFirstName} {adminInfo.adminLastName}</div>
          <div><span className="text-muted-foreground">Email:</span> {adminInfo.adminEmail || "Not set"}</div>
          <div><span className="text-muted-foreground">Role:</span> {adminInfo.adminRole || "school_admin"}</div>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Selected Modules</h4>
        <div className="flex flex-wrap gap-2">
          {(moduleInfo.selectedModules ?? ["sis", "academics"]).map((m: string) => (
            <Badge key={m} variant="secondary">{m}</Badge>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Branding</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Subdomain:</span> {brandingInfo.subdomain || "Not set"}.edumyles.com</div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Primary:</span>
            <div className="w-4 h-4 rounded" style={{ backgroundColor: brandingInfo.primaryColor ?? "#3B82F6" }} />
            {brandingInfo.primaryColor ?? "#3B82F6"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const { sessionToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [newTenantId, setNewTenantId] = useState("");

  // Queries
  const onboardingStatuses = usePlatformQuery(
    api.platform.onboarding.queries.listOnboardingStatuses,
    { sessionToken: sessionToken ?? "" }
  ) as OnboardingRecord[] | undefined;

  const tenants = usePlatformQuery(
    api.platform.tenants.queries.listAllTenants,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  ) as Array<{ tenantId: string; name: string; status?: string }> | undefined;

  const currentProgress = usePlatformQuery(
    api.platform.onboarding.queries.getOnboardingProgress,
    { sessionToken: sessionToken ?? "", tenantId: selectedTenant ?? "" },
    !!selectedTenant
  ) as OnboardingRecord | null | undefined;

  // Mutations
  const startOnboarding = useMutation(api.platform.onboarding.mutations.startOnboarding);
  const completeStep = useMutation(api.platform.onboarding.mutations.completeStep);
  const saveStepData = useMutation(api.platform.onboarding.mutations.saveStepData);
  const skipStep = useMutation(api.platform.onboarding.mutations.skipStep);
  const resetOnboarding = useMutation(api.platform.onboarding.mutations.resetOnboarding);

  const filteredStatuses = useMemo(() => {
    if (!onboardingStatuses) return [];
    if (!searchQuery) return onboardingStatuses;
    const q = searchQuery.toLowerCase();
    return onboardingStatuses.filter(
      (s) => s.tenantName.toLowerCase().includes(q) || s.tenantId.toLowerCase().includes(q)
    );
  }, [onboardingStatuses, searchQuery]);

  const availableTenants = useMemo(() => {
    if (!tenants) return [];
    const inProgressTenantIds = new Set((onboardingStatuses ?? []).map((record) => record.tenantId));
    return tenants
      .filter((tenant) => !inProgressTenantIds.has(tenant.tenantId))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tenants, onboardingStatuses]);

  useEffect(() => {
    if (!currentProgress) {
      setStepData({});
      return;
    }

    setWizardStep(currentProgress.currentStep);
    setStepData(currentProgress.data?.[`step_${currentProgress.currentStep}`] ?? {});
  }, [currentProgress?._id, currentProgress?.currentStep]);

  const handleStartOnboarding = async () => {
    if (!sessionToken || !newTenantId) return;
    try {
      await startOnboarding({ sessionToken, tenantId: newTenantId });
      setSelectedTenant(newTenantId);
      setStartDialogOpen(false);
      setNewTenantId("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveAndNext = async () => {
    if (!sessionToken || !selectedTenant) return;
    try {
      if (Object.keys(stepData).length > 0) {
        await saveStepData({ sessionToken, tenantId: selectedTenant, step: wizardStep, stepData });
      }
      await completeStep({ sessionToken, tenantId: selectedTenant, step: wizardStep });
      const nextStep = wizardStep + 1;
      setWizardStep(nextStep);
      setStepData(currentProgress?.data?.[`step_${nextStep}`] ?? {});
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSkip = async () => {
    if (!sessionToken || !selectedTenant) return;
    try {
      await skipStep({ sessionToken, tenantId: selectedTenant, step: wizardStep });
      const nextStep = wizardStep + 1;
      setWizardStep(nextStep);
      setStepData(currentProgress?.data?.[`step_${nextStep}`] ?? {});
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReset = async () => {
    if (!sessionToken || !selectedTenant) return;
    if (!confirm("Reset all onboarding progress for this tenant?")) return;
    try {
      await resetOnboarding({ sessionToken, tenantId: selectedTenant });
      setWizardStep(0);
      setStepData({});
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const renderStepForm = () => {
    switch (wizardStep) {
      case 0: return <SchoolInfoForm data={stepData} onChange={setStepData} />;
      case 1: return <AdminSetupForm data={stepData} onChange={setStepData} />;
      case 2: return <ModuleSelectionForm data={stepData} onChange={setStepData} />;
      case 3: return <BrandingForm data={stepData} onChange={setStepData} />;
      case 4: return <DataImportForm data={stepData} onChange={setStepData} />;
      case 5: return <ReviewStep allData={currentProgress?.data ?? {}} />;
      default: return null;
    }
  };

  // Stats
  const stats = useMemo(() => {
    if (!onboardingStatuses) return { total: 0, inProgress: 0, completed: 0, abandoned: 0 };
    return {
      total: onboardingStatuses.length,
      inProgress: onboardingStatuses.filter((s) => s.status === "in_progress").length,
      completed: onboardingStatuses.filter((s) => s.status === "completed").length,
      abandoned: onboardingStatuses.filter((s) => s.status === "abandoned").length,
    };
  }, [onboardingStatuses]);

  if (!onboardingStatuses || !tenants) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Onboarding"
        description="Guide new tenants through the setup process"
        actions={
          <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
            <DialogTrigger asChild>
              <Button><Rocket className="h-4 w-4 mr-2" /> Start Onboarding</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Onboarding</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Tenant</Label>
                  <Select value={newTenantId} onValueChange={setNewTenantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTenants.map((tenant) => (
                        <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                          {tenant.name} ({tenant.tenantId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableTenants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Every tenant already has an onboarding record. Continue an existing onboarding from the list below.
                    </p>
                  ) : null}
                </div>
                <Button onClick={handleStartOnboarding} className="w-full" disabled={!newTenantId}>
                  Start
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Rocket className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abandoned</p>
                <p className="text-2xl font-bold text-red-600">{stats.abandoned}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="wizard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wizard">Onboarding Wizard</TabsTrigger>
          <TabsTrigger value="all">All Tenants</TabsTrigger>
        </TabsList>

        {/* Wizard Tab */}
        <TabsContent value="wizard">
          {selectedTenant && currentProgress ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentProgress.tenantName}</CardTitle>
                      <CardDescription>Tenant ID: {currentProgress.tenantId}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={currentProgress.status} />
                      <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Reset
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedTenant(null); setWizardStep(0); setStepData({}); }}>
                        Close
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <StepperIndicator currentStep={wizardStep} completedSteps={currentProgress.completedSteps} />
                </CardContent>
              </Card>

              {currentProgress.status !== "completed" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ONBOARDING_STEPS[wizardStep]?.label}</CardTitle>
                    <CardDescription>{ONBOARDING_STEPS[wizardStep]?.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderStepForm()}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <Button variant="outline" disabled={wizardStep === 0} onClick={() => setWizardStep((s) => Math.max(0, s - 1))}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                      </Button>
                      <div className="flex gap-2">
                        {wizardStep === 4 && (
                          <Button variant="ghost" onClick={handleSkip}>Skip</Button>
                        )}
                        {wizardStep < 5 ? (
                          <Button onClick={handleSaveAndNext}>
                            Save & Next <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        ) : (
                          <Button onClick={handleSaveAndNext} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-1" /> Complete Onboarding
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Onboarding Complete</h3>
                      <p className="text-muted-foreground">This tenant has completed the onboarding process.</p>
                      {currentProgress.completedAt && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Completed on {new Date(currentProgress.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Rocket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Tenant Selected</h3>
                  <p className="text-muted-foreground mb-4">Select a tenant from the list below, or start a new onboarding.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Tenants Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Onboarding Status</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tenants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!onboardingStatuses ? (
                <LoadingSkeleton variant="table" count={5} />
              ) : filteredStatuses.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No onboarding records found</p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
                    <span>Tenant</span>
                    <span>Status</span>
                    <span>Progress</span>
                    <span>Current Step</span>
                    <span>Started</span>
                    <span>Actions</span>
                  </div>
                  {filteredStatuses.map((record) => (
                    <div key={record._id} className="grid grid-cols-6 gap-4 px-4 py-3 text-sm items-center hover:bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{record.tenantName}</p>
                        <p className="text-xs text-muted-foreground">{record.tenantId}</p>
                      </div>
                      <div><StatusBadge status={record.status} /></div>
                      <div>
                        <Progress value={(record.completedSteps.length / 6) * 100} className="h-2" />
                        <span className="text-xs text-muted-foreground">{record.completedSteps.length}/6 steps</span>
                      </div>
                      <div className="text-muted-foreground">
                        {ONBOARDING_STEPS[record.currentStep]?.label ?? "Complete"}
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(record.startedAt).toLocaleDateString()}
                      </div>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                            onClick={() => {
                              setSelectedTenant(record.tenantId);
                              setWizardStep(record.currentStep);
                              setStepData(record.data?.[`step_${record.currentStep}`] ?? {});
                            }}
                          >
                          <Play className="h-3 w-3 mr-1" />
                          {record.status === "completed" ? "View" : "Continue"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
