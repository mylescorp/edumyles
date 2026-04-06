"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { getRootDomain } from "@/lib/domains";
import { slugSchema, phoneSchema } from "@shared/validators";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  Shield,
  Sparkles,
} from "lucide-react";

const wizardSchema = z.object({
  schoolName: z.string().min(2, "School name is required"),
  schoolType: z.string().min(2, "School type is required"),
  country: z.string().min(2, "Country is required"),
  county: z.string().min(2, "Region or county is required"),
  address: z.string().optional(),
  websiteUrl: z.string().url("Enter a valid website URL").optional().or(z.literal("")),
  logoUrl: z.string().url("Enter a valid logo URL").optional().or(z.literal("")),
  adminFirstName: z.string().min(1, "Admin first name is required"),
  adminLastName: z.string().min(1, "Admin last name is required"),
  adminEmail: z.string().email("Valid admin email is required"),
  adminPhone: phoneSchema.optional().or(z.literal("")),
  adminJobTitle: z.string().min(2, "Job title is required"),
  sendMagicLink: z.boolean(),
  planId: z.string().min(1, "Select a plan"),
  billingCycle: z.enum(["monthly", "annual"]),
  customPriceMonthlyKes: z.string().optional(),
  customPriceAnnualKes: z.string().optional(),
  trialDays: z.string(),
  studentCountEstimate: z.string().optional(),
  paymentCollectionMode: z.enum(["collect_now", "prompt_later"]),
  subdomain: slugSchema,
  customDomain: z.string().optional(),
  timezone: z.string().min(2, "Timezone is required"),
  displayCurrency: z.string().min(3, "Display currency is required"),
  academicYearStartMonth: z.string(),
  termStructure: z.string().min(2, "Term structure is required"),
  selectedModuleIds: z.array(z.string()),
  pilotGrantModuleIds: z.array(z.string()),
  welcomeTemplate: z.string().min(1, "Welcome template is required"),
  welcomeMessage: z.string().optional(),
  sendWelcomeImmediately: z.boolean(),
});

type WizardData = z.infer<typeof wizardSchema>;

const STEP_TITLES = [
  "School Information",
  "Admin Account",
  "Subscription Setup",
  "Initial Configuration",
  "Module Setup",
  "Invite & Welcome",
] as const;

const DEFAULT_TIMEZONE = "Africa/Nairobi";

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function TenantProvisioningWizard({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const provisionTenant = useMutation(api.platform.tenants.mutations.provisionTenant);

  const plans = useQuery(api.modules.platform.subscriptions.getSubscriptionPlans, {});
  const modules = useQuery(api.modules.marketplace.modules.getPublishedModules, {});
  const currencies = useQuery(api.modules.platform.currency.getSupportedCurrencies, {});

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<WizardData>({
    schoolName: "",
    schoolType: "",
    country: "Kenya",
    county: "",
    address: "",
    websiteUrl: "",
    logoUrl: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPhone: "",
    adminJobTitle: "",
    sendMagicLink: true,
    planId: "",
    billingCycle: "monthly",
    customPriceMonthlyKes: "",
    customPriceAnnualKes: "",
    trialDays: "14",
    studentCountEstimate: "",
    paymentCollectionMode: "prompt_later",
    subdomain: "",
    customDomain: "",
    timezone: DEFAULT_TIMEZONE,
    displayCurrency: "KES",
    academicYearStartMonth: "1",
    termStructure: "termly",
    selectedModuleIds: [],
    pilotGrantModuleIds: [],
    welcomeTemplate: "standard-platform-welcome",
    welcomeMessage: "",
    sendWelcomeImmediately: true,
  });

  const planList = useMemo(() => (plans as Array<any> | undefined) ?? [], [plans]);
  const publishedModules = useMemo(() => (modules as Array<any> | undefined) ?? [], [modules]);
  const currencyOptions = useMemo(() => (currencies as Array<any> | undefined) ?? [], [currencies]);

  const selectedPlan = useMemo(
    () => planList.find((plan) => plan.name === formData.planId),
    [planList, formData.planId]
  );

  const includedModuleIds = useMemo(
    () => (selectedPlan?.includedModuleIds as string[] | undefined) ?? [],
    [selectedPlan]
  );

  const planModuleDetails = useMemo(() => {
    return includedModuleIds.map((moduleId) => {
      const match = publishedModules.find(
        (module) => String(module._id) === moduleId || module.slug === moduleId || module.name === moduleId
      );
      return {
        id: moduleId,
        name: match?.name ?? moduleId,
        category: match?.category ?? "core",
      };
    });
  }, [includedModuleIds, publishedModules]);

  const pilotCandidates = useMemo(() => {
    const included = new Set(formData.selectedModuleIds);
    return publishedModules.filter((module) => !included.has(String(module._id)) && !included.has(module.slug));
  }, [formData.selectedModuleIds, publishedModules]);

  const progress = ((currentStep + 1) / STEP_TITLES.length) * 100;

  const setField = <K extends keyof WizardData>(field: K, value: WizardData[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => {
      if (!current[field as string]) return current;
      const next = { ...current };
      delete next[field as string];
      return next;
    });
  };

  const validateCurrentStep = () => {
    const result = wizardSchema.safeParse(formData);
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string" && !nextErrors[path]) {
          nextErrors[path] = issue.message;
        }
      }
      setFormErrors(nextErrors);
      return false;
    }

    if (currentStep === 3 && formData.customDomain && !["pro", "enterprise"].includes(formData.planId)) {
      setFormErrors((current) => ({ ...current, customDomain: "Custom domains require a Pro or Enterprise plan" }));
      return false;
    }

    if (currentStep === 4 && formData.selectedModuleIds.length === 0) {
      setFormErrors((current) => ({ ...current, selectedModuleIds: "Select at least one module bundle item" }));
      return false;
    }

    return true;
  };

  const handleNext = () => {
    setError(null);
    if (!validateCurrentStep()) return;
    setCurrentStep((step) => Math.min(step + 1, STEP_TITLES.length - 1));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const toggleSelectedModule = (moduleId: string) => {
    setField(
      "selectedModuleIds",
      formData.selectedModuleIds.includes(moduleId)
        ? formData.selectedModuleIds.filter((item) => item !== moduleId)
        : [...formData.selectedModuleIds, moduleId]
    );
  };

  const togglePilotGrant = (moduleId: string) => {
    setField(
      "pilotGrantModuleIds",
      formData.pilotGrantModuleIds.includes(moduleId)
        ? formData.pilotGrantModuleIds.filter((item) => item !== moduleId)
        : [...formData.pilotGrantModuleIds, moduleId]
    );
  };

  const autoSuggestSubdomain = () => {
    const suggestion = formData.schoolName
      .toLowerCase()
      .replace(/[^a-z0-9\\s-]/g, "")
      .trim()
      .replace(/\\s+/g, "-")
      .slice(0, 40);
    if (suggestion) {
      setField("subdomain", suggestion);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validateCurrentStep()) return;
    if (!sessionToken) {
      setError("Authentication expired. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await provisionTenant({
        sessionToken,
        schoolName: formData.schoolName,
        schoolType: formData.schoolType,
        country: formData.country,
        county: formData.county,
        address: formData.address || undefined,
        websiteUrl: formData.websiteUrl || undefined,
        logoUrl: formData.logoUrl || undefined,
        adminFirstName: formData.adminFirstName,
        adminLastName: formData.adminLastName,
        adminEmail: formData.adminEmail,
        adminPhone: formData.adminPhone || undefined,
        adminJobTitle: formData.adminJobTitle,
        sendMagicLink: formData.sendMagicLink,
        planId: formData.planId,
        billingCycle: formData.billingCycle,
        customPriceMonthlyKes: toNumber(formData.customPriceMonthlyKes),
        customPriceAnnualKes: toNumber(formData.customPriceAnnualKes),
        trialDays: Number(formData.trialDays),
        studentCountEstimate: toNumber(formData.studentCountEstimate),
        paymentCollectionMode: formData.paymentCollectionMode,
        subdomain: formData.subdomain,
        customDomain: formData.customDomain || undefined,
        timezone: formData.timezone,
        displayCurrency: formData.displayCurrency,
        academicYearStartMonth: Number(formData.academicYearStartMonth),
        termStructure: formData.termStructure,
        selectedModuleIds: formData.selectedModuleIds,
        pilotGrantModuleIds: formData.pilotGrantModuleIds,
        welcomeTemplate: formData.welcomeTemplate,
        welcomeMessage: formData.welcomeMessage || undefined,
        sendWelcomeImmediately: formData.sendWelcomeImmediately,
      });

      await fetch("/api/tenants/provision-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, tenantId: result.tenantId }),
      }).catch(() => null);

      router.push("/platform/tenants");
    } catch (submitError: any) {
      setError(submitError?.message ?? "Failed to provision tenant");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (plans === undefined || modules === undefined || currencies === undefined) {
    return (
      <Card className={className}>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Step {currentStep + 1} of {STEP_TITLES.length}
              </p>
              <h2 className="text-xl font-semibold">{STEP_TITLES[currentStep]}</h2>
            </div>
            <Badge variant="secondary">{Math.round(progress)}% complete</Badge>
          </div>
          <Progress value={progress} />
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {STEP_TITLES.map((step, index) => (
              <div
                key={step}
                className={`rounded-lg border px-3 py-2 text-xs ${
                  index === currentStep
                    ? "border-primary bg-primary/5 text-primary"
                    : index < currentStep
                      ? "border-[#26A65B]/30 bg-[rgba(38,166,91,0.08)] text-[#26A65B]"
                      : "border-border/60 text-muted-foreground"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-6 p-6">
          {currentStep === 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>School name</Label>
                <Input value={formData.schoolName} onChange={(e) => setField("schoolName", e.target.value)} />
                {formErrors.schoolName && <p className="text-xs text-destructive">{formErrors.schoolName}</p>}
              </div>
              <div className="space-y-2">
                <Label>School type</Label>
                <Input
                  value={formData.schoolType}
                  onChange={(e) => setField("schoolType", e.target.value)}
                  placeholder="Primary, Secondary, University, College..."
                />
                {formErrors.schoolType && <p className="text-xs text-destructive">{formErrors.schoolType}</p>}
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={formData.country} onChange={(e) => setField("country", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Region / county</Label>
                <Input value={formData.county} onChange={(e) => setField("county", e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Physical address</Label>
                <Textarea value={formData.address} onChange={(e) => setField("address", e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input value={formData.websiteUrl} onChange={(e) => setField("websiteUrl", e.target.value)} placeholder="https://school.edumyles.com" />
                {formErrors.websiteUrl && <p className="text-xs text-destructive">{formErrors.websiteUrl}</p>}
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input value={formData.logoUrl} onChange={(e) => setField("logoUrl", e.target.value)} placeholder="https://..." />
                {formErrors.logoUrl && <p className="text-xs text-destructive">{formErrors.logoUrl}</p>}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Admin first name</Label>
                <Input value={formData.adminFirstName} onChange={(e) => setField("adminFirstName", e.target.value)} />
                {formErrors.adminFirstName && <p className="text-xs text-destructive">{formErrors.adminFirstName}</p>}
              </div>
              <div className="space-y-2">
                <Label>Admin last name</Label>
                <Input value={formData.adminLastName} onChange={(e) => setField("adminLastName", e.target.value)} />
                {formErrors.adminLastName && <p className="text-xs text-destructive">{formErrors.adminLastName}</p>}
              </div>
              <div className="space-y-2">
                <Label>Work email</Label>
                <Input type="email" value={formData.adminEmail} onChange={(e) => setField("adminEmail", e.target.value)} />
                {formErrors.adminEmail && <p className="text-xs text-destructive">{formErrors.adminEmail}</p>}
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.adminPhone} onChange={(e) => setField("adminPhone", e.target.value)} placeholder="+2547..." />
                {formErrors.adminPhone && <p className="text-xs text-destructive">{formErrors.adminPhone}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Job title</Label>
                <Input value={formData.adminJobTitle} onChange={(e) => setField("adminJobTitle", e.target.value)} placeholder="Principal, Director, ICT Lead..." />
                {formErrors.adminJobTitle && <p className="text-xs text-destructive">{formErrors.adminJobTitle}</p>}
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <Checkbox checked={formData.sendMagicLink} onCheckedChange={(checked) => setField("sendMagicLink", Boolean(checked))} />
                <div>
                  <p className="text-sm font-medium">Send magic link</p>
                  <p className="text-xs text-muted-foreground">If unchecked, the school admin still receives the standard invite email.</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                {planList.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setField("planId", plan.name);
                      setField("selectedModuleIds", [...(plan.includedModuleIds ?? [])]);
                    }}
                    className={`rounded-xl border p-4 text-left transition ${
                      formData.planId === plan.name ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          KES {plan.priceMonthlyKes?.toLocaleString() ?? 0}/mo
                          {plan.priceAnnualKes ? ` or KES ${plan.priceAnnualKes.toLocaleString()}/yr` : ""}
                        </p>
                      </div>
                      {plan.isDefault ? <Badge>Default</Badge> : null}
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Includes {(plan.includedModuleIds ?? []).length} bundled module{(plan.includedModuleIds ?? []).length === 1 ? "" : "s"}.
                    </p>
                  </button>
                ))}
              </div>
              {formErrors.planId && <p className="text-xs text-destructive">{formErrors.planId}</p>}

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Billing cycle</Label>
                  <Select value={formData.billingCycle} onValueChange={(value: "monthly" | "annual") => setField("billingCycle", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trial days</Label>
                  <Input type="number" min="0" value={formData.trialDays} onChange={(e) => setField("trialDays", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Custom monthly price (KES)</Label>
                  <Input type="number" min="0" value={formData.customPriceMonthlyKes} onChange={(e) => setField("customPriceMonthlyKes", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Custom annual price (KES)</Label>
                  <Input type="number" min="0" value={formData.customPriceAnnualKes} onChange={(e) => setField("customPriceAnnualKes", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Student count estimate</Label>
                  <Input type="number" min="0" value={formData.studentCountEstimate} onChange={(e) => setField("studentCountEstimate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Payment collection</Label>
                  <Select value={formData.paymentCollectionMode} onValueChange={(value: "collect_now" | "prompt_later") => setField("paymentCollectionMode", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prompt_later">Prompt school admin later</SelectItem>
                      <SelectItem value="collect_now">Collect now</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Subdomain</Label>
                <div className="flex gap-2">
                  <Input value={formData.subdomain} onChange={(e) => setField("subdomain", e.target.value.toLowerCase())} />
                  <Button type="button" variant="outline" onClick={autoSuggestSubdomain}>Suggest</Button>
                </div>
                <p className="text-xs text-muted-foreground">Will resolve as `{formData.subdomain || "school"}.{getRootDomain()}`</p>
                {formErrors.subdomain && <p className="text-xs text-destructive">{formErrors.subdomain}</p>}
              </div>
              <div className="space-y-2">
                <Label>Custom domain</Label>
                <Input value={formData.customDomain} onChange={(e) => setField("customDomain", e.target.value)} placeholder="school.example.com" />
                {formErrors.customDomain && <p className="text-xs text-destructive">{formErrors.customDomain}</p>}
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input value={formData.timezone} onChange={(e) => setField("timezone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Display currency</Label>
                <Select value={formData.displayCurrency} onValueChange={(value) => setField("displayCurrency", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} ({currency.symbol}) - {currency.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic year start month</Label>
                <Select value={formData.academicYearStartMonth} onValueChange={(value) => setField("academicYearStartMonth", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                      <SelectItem key={month} value={String(month)}>
                        {new Date(2026, month - 1, 1).toLocaleString("en-US", { month: "long" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Term structure</Label>
                <Select value={formData.termStructure} onValueChange={(value) => setField("termStructure", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="termly">3 terms</SelectItem>
                    <SelectItem value="semester">2 semesters</SelectItem>
                    <SelectItem value="quarterly">4 quarters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">Bundle modules</h3>
                  <p className="text-sm text-muted-foreground">
                    Modules included in the selected plan are preloaded from Convex and can be toggled before provisioning.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {planModuleDetails.map((module) => (
                    <button
                      type="button"
                      key={module.id}
                      onClick={() => toggleSelectedModule(module.id)}
                      className={`rounded-xl border p-4 text-left transition ${
                        formData.selectedModuleIds.includes(module.id) ? "border-primary bg-primary/5" : "border-border/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{module.name}</p>
                          <p className="text-xs text-muted-foreground">{module.category}</p>
                        </div>
                        {formData.selectedModuleIds.includes(module.id) ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
                      </div>
                    </button>
                  ))}
                </div>
                {formErrors.selectedModuleIds && <p className="text-xs text-destructive">{formErrors.selectedModuleIds}</p>}
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">Additional pilot grants</h3>
                  <p className="text-sm text-muted-foreground">Choose optional marketplace modules to grant temporarily during onboarding.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {pilotCandidates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No additional published modules are currently available for pilot grants.</p>
                  ) : (
                    pilotCandidates.slice(0, 12).map((module) => {
                      const moduleId = String(module._id);
                      return (
                        <button
                          type="button"
                          key={moduleId}
                          onClick={() => togglePilotGrant(moduleId)}
                          className={`rounded-xl border p-4 text-left transition ${
                            formData.pilotGrantModuleIds.includes(moduleId) ? "border-primary bg-primary/5" : "border-border/60"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{module.name}</p>
                              <p className="text-xs text-muted-foreground">{module.category}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{module.tagline ?? module.description}</p>
                            </div>
                            {formData.pilotGrantModuleIds.includes(moduleId) ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Welcome email template</Label>
                  <Input value={formData.welcomeTemplate} onChange={(e) => setField("welcomeTemplate", e.target.value)} />
                </div>
                <div className="flex items-center gap-3 pt-7">
                  <Checkbox checked={formData.sendWelcomeImmediately} onCheckedChange={(checked) => setField("sendWelcomeImmediately", Boolean(checked))} />
                  <div>
                    <p className="text-sm font-medium">Send immediately</p>
                    <p className="text-xs text-muted-foreground">If unchecked, the tenant is provisioned but the invite email is not sent yet.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Personal message</Label>
                <Textarea value={formData.welcomeMessage} onChange={(e) => setField("welcomeMessage", e.target.value)} rows={4} />
              </div>

              <Card className="border-border/60 bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-base">Provisioning summary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <p className="font-medium">{formData.schoolName || "School name not set"}</p>
                    <p className="text-muted-foreground">{formData.schoolType || "School type pending"}</p>
                    <p className="text-muted-foreground">{formData.country} / {formData.county}</p>
                  </div>
                  <div>
                    <p className="font-medium">{formData.adminFirstName} {formData.adminLastName}</p>
                    <p className="text-muted-foreground">{formData.adminEmail}</p>
                    <p className="text-muted-foreground">{formData.adminJobTitle}</p>
                  </div>
                  <div>
                    <p className="font-medium">Plan: {formData.planId || "Not selected"}</p>
                    <p className="text-muted-foreground">Billing: {formData.billingCycle}</p>
                    <p className="text-muted-foreground">Trial: {formData.trialDays} day(s)</p>
                  </div>
                  <div>
                    <p className="font-medium">{formData.subdomain || "subdomain"}.{getRootDomain()}</p>
                    <p className="text-muted-foreground">{formData.displayCurrency} / {formData.timezone}</p>
                    <p className="text-muted-foreground">{formData.selectedModuleIds.length} bundle modules, {formData.pilotGrantModuleIds.length} pilot grants</p>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  The current provisioning flow creates the tenant, organization placeholder, subscription, onboarding record, selected installed modules, pilot grants, and pending school-admin invite in one mutation.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 0 || isSubmitting}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-3">
              {currentStep < STEP_TITLES.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Provisioning...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Provision Tenant
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-start gap-3 p-5">
            <Shield className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="font-medium">Server-side provisioning</p>
              <p className="text-sm text-muted-foreground">Tenant creation, subscriptions, onboarding, modules, and grants are all persisted in Convex.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-start gap-3 p-5">
            <Globe className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="font-medium">Canonical domain</p>
              <p className="text-sm text-muted-foreground">Subdomains are generated against `{getRootDomain()}` and WorkOS org provisioning runs immediately after create.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-start gap-3 p-5">
            <Mail className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="font-medium">Invite-ready admin account</p>
              <p className="text-sm text-muted-foreground">The school admin is staged as a pending user and can receive the standard EduMyles invite email immediately.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
