"use client";

import { useEffect, useMemo, useState } from "react";
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
import { slugSchema, phoneSchema, tenantCurriculumSelectionSchema } from "@shared/validators";
import { DEFAULT_SCHOOL_CURRICULUM_CODE, SCHOOL_CURRICULA, type SchoolCurriculumCode } from "@shared/constants";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Globe,
  ListChecks,
  Loader2,
  Mail,
  Shield,
  Sparkles,
} from "lucide-react";

const wizardSchema = z.object({
  organizationMode: z.enum(["single_campus", "multi_campus_network"]),
  networkName: z.string().optional(),
  schoolName: z.string().min(2, "School name is required"),
  primaryCampusName: z.string().optional(),
  primaryCampusCode: z.string().optional(),
  schoolType: z.string().min(2, "School type is required"),
  curriculumMode: z.enum(["single", "multi"]),
  primaryCurriculumCode: z.string().min(1, "Primary curriculum is required"),
  activeCurriculumCodes: z.array(z.string()).min(1, "Select at least one curriculum"),
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
  billingCycle: z.enum(["monthly", "quarterly", "annual"]),
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
  "Tenant Configuration",
  "Module Access",
  "Launch & Handoff",
] as const;

const SHARED_SETUP_FLOW = [
  "School Profile",
  "Academic Year",
  "Grading System",
  "Subjects",
  "Classes",
  "Fee Structure",
  "Staff",
  "Students",
  "Modules",
  "Customize",
  "Parents",
  "First Action",
] as const;

const STEP_FIELDS: Array<Array<keyof WizardData>> = [
  [
    "organizationMode",
    "networkName",
    "schoolName",
    "primaryCampusName",
    "primaryCampusCode",
    "schoolType",
    "curriculumMode",
    "primaryCurriculumCode",
    "activeCurriculumCodes",
    "country",
    "county",
    "websiteUrl",
    "logoUrl",
  ],
  ["adminFirstName", "adminLastName", "adminEmail", "adminPhone", "adminJobTitle"],
  [
    "planId",
    "billingCycle",
    "customPriceMonthlyKes",
    "customPriceAnnualKes",
    "trialDays",
    "studentCountEstimate",
    "paymentCollectionMode",
  ],
  ["subdomain", "customDomain", "timezone", "displayCurrency", "academicYearStartMonth", "termStructure"],
  ["selectedModuleIds", "pilotGrantModuleIds"],
  ["welcomeTemplate", "welcomeMessage", "sendWelcomeImmediately"],
];

const DEFAULT_TIMEZONE = "Africa/Nairobi";
const SCHOOL_TYPE_OPTIONS = [
  "Pre-Primary",
  "Primary School",
  "Junior Secondary",
  "Secondary School",
  "Technical Institute",
  "TVET College",
  "College",
  "University",
  "International School",
  "Special Needs School",
] as const;

const ADMIN_JOB_TITLE_OPTIONS = [
  "School Owner",
  "Director",
  "Principal",
  "Deputy Principal",
  "Head Teacher",
  "Deputy Head Teacher",
  "Bursar",
  "Administrator",
  "ICT Lead",
  "Academic Registrar",
  "Operations Manager",
  "Finance Manager",
] as const;

const ADDRESS_OPTIONS = [
  "Town / CBD Campus",
  "Suburban Campus",
  "Peri-Urban Campus",
  "Rural Campus",
  "Highway / Roadside Campus",
  "Multi-Campus Setup",
] as const;

type LocationOption = {
  label: string;
  value: string;
};

type AdditionalCampusDraft = {
  campusName: string;
  schoolName: string;
  campusCode: string;
  subdomain: string;
  county: string;
  country: string;
  schoolType: string;
};

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeList<T>(value: unknown, candidateKeys: string[] = []): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  for (const key of candidateKeys) {
    const candidate = (value as Record<string, unknown>)[key];
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }

  return [];
}

function getWebsiteSubdomainValue(websiteUrl?: string) {
  if (!websiteUrl) return "";

  try {
    const url = new URL(websiteUrl);
    const hostSuffix = `.${getRootDomain()}`;
    return url.hostname.endsWith(hostSuffix)
      ? url.hostname.slice(0, -hostSuffix.length)
      : url.hostname;
  } catch {
    return websiteUrl
      .replace(/^https?:\/\//i, "")
      .replace(new RegExp(`\\.${getRootDomain().replace(".", "\\.")}$`, "i"), "")
      .replace(/\/.*$/, "");
  }
}

function createSlugSuggestion(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || ""
  );
}

export function TenantProvisioningWizard({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { sessionToken } = useAuth();

  const planCatalog = useQuery(
    api.modules.platform.subscriptions.getPlatformPlanCatalog,
    sessionToken ? { sessionToken } : "skip"
  );
  const plans = useQuery(api.modules.platform.subscriptions.getSubscriptionPlans, {});
  const modules = useQuery(api.modules.marketplace.modules.getPublishedModules, {});
  const currencies = useQuery(
    api.modules.platform.currency.getSupportedCurrencies,
    sessionToken ? { sessionToken } : "skip"
  );
  const provisionTenant = useMutation(api.platform.tenants.mutations.provisionTenant);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitStage, setSubmitStage] = useState<string | null>(null);
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [regions, setRegions] = useState<LocationOption[]>([]);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [subdomainEdited, setSubdomainEdited] = useState(false);
  const [formData, setFormData] = useState<WizardData>({
    organizationMode: "single_campus",
    networkName: "",
    schoolName: "",
    primaryCampusName: "",
    primaryCampusCode: "",
    schoolType: "",
    curriculumMode: "single",
    primaryCurriculumCode: DEFAULT_SCHOOL_CURRICULUM_CODE,
    activeCurriculumCodes: [DEFAULT_SCHOOL_CURRICULUM_CODE],
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
  const [additionalCampuses, setAdditionalCampuses] = useState<AdditionalCampusDraft[]>([]);
  const subdomainAvailability = useQuery(
    api.platform.tenants.queries.checkSubdomainAvailability,
    sessionToken && formData.subdomain.trim().length >= 3
      ? { sessionToken, subdomain: formData.subdomain.trim().toLowerCase() }
      : "skip",
    !!sessionToken && formData.subdomain.trim().length >= 3
  );

  const planList = useMemo(
    () => {
      const platformPlans = normalizeList<any>(planCatalog, ["plans", "items", "data"]);
      if (platformPlans.length > 0 || planCatalog !== undefined) {
        return platformPlans;
      }

      return normalizeList<any>(plans, ["plans", "items", "data"]);
    },
    [planCatalog, plans]
  );
  const publishedModules = useMemo(
    () => normalizeList<any>(modules, ["modules", "items", "data"]),
    [modules]
  );
  const currencyOptions = useMemo(
    () => normalizeList<any>(currencies, ["currencies", "items", "data"]),
    [currencies]
  );

  const selectedPlan = useMemo(
    () => planList.find((plan) => plan.name === formData.planId),
    [planList, formData.planId]
  );

  const includedModuleIds = useMemo(
    () => (selectedPlan?.includedModuleIds as string[] | undefined) ?? [],
    [selectedPlan]
  );

  const planModuleDetails = useMemo(() => {
    const details = includedModuleIds.map((moduleId) => {
      const match = publishedModules.find(
        (module) => String(module._id) === moduleId || module.slug === moduleId || module.name === moduleId
      );
      return {
        id: moduleId,
        name: match?.name ?? moduleId,
        category: match?.category ?? "core",
      };
    });

    if (details.length > 0) {
      return details;
    }

    return (selectedPlan?.includedModules as Array<any> | undefined)?.map((module) => ({
      id: String(module.id ?? module._id ?? module.name),
      name: module.name ?? String(module.id ?? module._id ?? "Module"),
      category: module.category ?? "core",
    })) ?? [];
  }, [includedModuleIds, publishedModules, selectedPlan]);

  const pilotCandidates = useMemo(() => {
    const included = new Set(formData.selectedModuleIds);
    return publishedModules.filter((module) => !included.has(String(module._id)) && !included.has(module.slug));
  }, [formData.selectedModuleIds, publishedModules]);

  const websiteSubdomainValue = getWebsiteSubdomainValue(formData.websiteUrl);
  const subdomainStatusTone =
    formData.subdomain.trim().length < 3
      ? "text-muted-foreground"
      : subdomainAvailability === undefined
        ? "text-[var(--platform-accent)]"
        : subdomainAvailability.available
          ? "text-[var(--em-success)]"
          : "text-destructive";
  const regionOptions = regions;

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
      const currentStepFields = new Set(STEP_FIELDS[currentStep]);
      for (const issue of result.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string" && currentStepFields.has(path as keyof WizardData) && !nextErrors[path]) {
          nextErrors[path] = issue.message;
        }
      }
      if (Object.keys(nextErrors).length > 0) {
        setFormErrors(nextErrors);
        return false;
      }
    }

    if (currentStep === 0) {
      const curriculumResult = tenantCurriculumSelectionSchema.safeParse({
        curriculumMode: formData.curriculumMode,
        primaryCurriculumCode: formData.primaryCurriculumCode,
        activeCurriculumCodes: formData.activeCurriculumCodes,
      });

      if (!curriculumResult.success) {
        const nextErrors: Record<string, string> = {};
        for (const issue of curriculumResult.error.issues) {
          const path = issue.path[0];
          if (typeof path === "string" && !nextErrors[path]) {
            nextErrors[path] = issue.message;
          }
        }
        setFormErrors((current) => ({ ...current, ...nextErrors }));
        return false;
      }
    }

    if (currentStep === 0 && formData.organizationMode === "multi_campus_network") {
      const nextErrors: Record<string, string> = {};
      if (!formData.networkName?.trim()) {
        nextErrors.networkName = "Network name is required for multi-campus onboarding";
      }
      if (!formData.primaryCampusName?.trim()) {
        nextErrors.primaryCampusName = "Primary campus name is required";
      }
      for (const [index, campus] of additionalCampuses.entries()) {
        if (!campus.campusName.trim()) {
          nextErrors[`additionalCampus-${index}`] = "Each additional campus needs a name";
        }
      }
      if (Object.keys(nextErrors).length > 0) {
        setFormErrors((current) => ({ ...current, ...nextErrors }));
        return false;
      }
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

  useEffect(() => {
    if (!formData.schoolName || subdomainEdited) return;
    const suggestion = createSlugSuggestion(formData.schoolName);
    if (suggestion) {
      setFormData((current) => ({ ...current, subdomain: suggestion }));
    }
  }, [formData.schoolName, subdomainEdited]);

  useEffect(() => {
    if (formData.planId || planList.length === 0) {
      return;
    }

    const defaultPlan = planList.find((plan) => plan.isDefault) ?? planList[0];
    if (!defaultPlan) {
      return;
    }

    setFormData((current) => ({
      ...current,
      planId: defaultPlan.name,
      selectedModuleIds:
        current.selectedModuleIds.length > 0
          ? current.selectedModuleIds
          : [...((defaultPlan.includedModuleIds as string[] | undefined) ?? [])],
    }));
  }, [formData.planId, planList]);

  useEffect(() => {
    let isMounted = true;

    const loadCountries = async () => {
      setIsLoadingCountries(true);
      setGeoError(null);

      try {
        const response = await fetch("/api/geo/countries", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          items?: LocationOption[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load countries");
        }

        if (!isMounted) return;
        setCountries(payload.items ?? []);
      } catch (loadError) {
        if (!isMounted) return;
        const message = loadError instanceof Error ? loadError.message : "Failed to load countries";
        setGeoError(message);
        setCountries([]);
      } finally {
        if (isMounted) {
          setIsLoadingCountries(false);
        }
      }
    };

    void loadCountries();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!formData.country) {
      setRegions([]);
      return () => {
        isMounted = false;
      };
    }

    const loadRegions = async () => {
      setIsLoadingRegions(true);
      setGeoError(null);

      try {
        const response = await fetch(`/api/geo/regions?country=${encodeURIComponent(formData.country)}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          items?: LocationOption[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load regions");
        }

        if (!isMounted) return;
        setRegions(payload.items ?? []);
      } catch (loadError) {
        if (!isMounted) return;
        const message = loadError instanceof Error ? loadError.message : "Failed to load regions";
        setGeoError(message);
        setRegions([]);
      } finally {
        if (isMounted) {
          setIsLoadingRegions(false);
        }
      }
    };

    void loadRegions();

    return () => {
      isMounted = false;
    };
  }, [formData.country]);

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

  const handleCurriculumModeChange = (value: WizardData["curriculumMode"]) => {
    if (value === "single") {
      setFormData((current) => ({
        ...current,
        curriculumMode: value,
        activeCurriculumCodes: [current.primaryCurriculumCode],
      }));
      return;
    }

    setField("curriculumMode", value);
  };

  const handlePrimaryCurriculumChange = (value: string) => {
    setFormData((current) => {
      const nextPrimary = value as SchoolCurriculumCode;
      const activeCurriculumCodes =
        current.curriculumMode === "single"
          ? [nextPrimary]
          : current.activeCurriculumCodes.includes(nextPrimary)
            ? current.activeCurriculumCodes
            : [...current.activeCurriculumCodes, nextPrimary];

      return {
        ...current,
        primaryCurriculumCode: nextPrimary,
        activeCurriculumCodes,
      };
    });
    setFormErrors((current) => {
      const next = { ...current };
      delete next.primaryCurriculumCode;
      delete next.activeCurriculumCodes;
      return next;
    });
  };

  const toggleActiveCurriculumCode = (value: SchoolCurriculumCode) => {
    setFormData((current) => {
      if (current.curriculumMode === "single") {
        return {
          ...current,
          primaryCurriculumCode: value,
          activeCurriculumCodes: [value],
        };
      }

      const isActive = current.activeCurriculumCodes.includes(value);
      const nextActiveCurriculumCodes = isActive
        ? current.activeCurriculumCodes.filter((code) => code !== value)
        : [...current.activeCurriculumCodes, value];

      return {
        ...current,
        activeCurriculumCodes: nextActiveCurriculumCodes,
        primaryCurriculumCode: nextActiveCurriculumCodes.includes(current.primaryCurriculumCode)
          ? current.primaryCurriculumCode
          : (nextActiveCurriculumCodes[0] ?? current.primaryCurriculumCode),
      };
    });
    setFormErrors((current) => {
      const next = { ...current };
      delete next.primaryCurriculumCode;
      delete next.activeCurriculumCodes;
      return next;
    });
  };

  const autoSuggestSubdomain = () => {
    const suggestion = createSlugSuggestion(formData.schoolName);
    if (suggestion) {
      setSubdomainEdited(false);
      setField("subdomain", suggestion);
    }
  };

  const updateWebsiteSubdomain = (value: string) => {
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^-+|-+$/g, "");

    setField("websiteUrl", normalized ? `https://${normalized}.${getRootDomain()}` : "");
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
      setSubmitStage("Creating tenant workspace");
      const result = await provisionTenant({
        sessionToken,
        organizationMode: formData.organizationMode,
        networkName:
          formData.organizationMode === "multi_campus_network" ? formData.networkName || undefined : undefined,
        schoolName: formData.schoolName,
        schoolType: formData.schoolType,
        curriculumMode: formData.curriculumMode,
        primaryCurriculumCode: formData.primaryCurriculumCode,
        activeCurriculumCodes: formData.activeCurriculumCodes,
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
        primaryCampus:
          formData.organizationMode === "multi_campus_network"
            ? {
                campusName: formData.primaryCampusName || formData.schoolName,
                campusCode: formData.primaryCampusCode || undefined,
                schoolName: formData.schoolName,
                subdomain: formData.subdomain,
                county: formData.county,
                country: formData.country,
                schoolType: formData.schoolType,
              }
            : undefined,
        additionalCampuses:
          formData.organizationMode === "multi_campus_network"
            ? additionalCampuses
                .filter((campus) => campus.campusName.trim())
                .map((campus) => ({
                  campusName: campus.campusName.trim(),
                  campusCode: campus.campusCode.trim() || undefined,
                  schoolName: campus.schoolName.trim() || campus.campusName.trim(),
                  subdomain: campus.subdomain.trim().toLowerCase(),
                  county: campus.county.trim() || formData.county,
                  country: campus.country.trim() || formData.country,
                  schoolType: campus.schoolType.trim() || formData.schoolType,
                }))
            : undefined,
      });

      setSubmitStage("Provisioning organization");
      const orgResponse = await fetch("/api/tenants/provision-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, tenantId: result.tenantId }),
      });
      const orgPayload = await orgResponse.json().catch(() => ({}));
      if (!orgResponse.ok) {
        throw new Error(orgPayload.error ?? "Failed to provision WorkOS organization");
      }

      setSubmitStage("Sending WorkOS invitation");
      const inviteResponse = await fetch("/api/tenants/invite-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          tenantId: result.tenantId,
          email: formData.adminEmail,
          firstName: formData.adminFirstName,
          lastName: formData.adminLastName,
          role: "school_admin",
        }),
      });
      const invitePayload = await inviteResponse.json().catch(() => ({}));
      if (!inviteResponse.ok) {
        throw new Error(invitePayload.error ?? "Failed to send WorkOS invitation");
      }

      setSubmitStage("Redirecting to tenant profile");
      router.push(`/platform/tenants/${result.tenantId}`);
    } catch (submitError: any) {
      setError(submitError?.message ?? "Failed to provision tenant");
    } finally {
      setIsSubmitting(false);
      setSubmitStage(null);
    }
  };

  if ((planCatalog === undefined && plans === undefined) || modules === undefined || currencies === undefined) {
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Platform kickoff section {currentStep + 1} of {STEP_TITLES.length}</Badge>
                <Badge variant="outline">Shared tenant setup flow</Badge>
              </div>
              <h2 className="mt-2 text-xl font-semibold">{STEP_TITLES[currentStep]}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This page collects platform-only kickoff details, then opens the school inside the same 12-step setup flow used by invited tenants.
              </p>
            </div>
            <Card className="w-full max-w-xl border-border/60 bg-muted/20 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <ListChecks className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Shared 12-step setup after provisioning</p>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {SHARED_SETUP_FLOW.map((step) => (
                        <div
                          key={step}
                          className="rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground"
                        >
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold">Platform kickoff sections</p>
                <p className="text-sm text-muted-foreground">
                  These six platform-only sections prepare the tenant, then hand the school into the shared school-admin setup journey.
                </p>
              </div>
              <Badge variant="outline" className="w-fit">
                Current section: {currentStep + 1} / {STEP_TITLES.length}
              </Badge>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {STEP_TITLES.map((step, index) => (
                <div
                  key={step}
                  className={`rounded-xl border px-4 py-3 ${
                    index === currentStep
                      ? "border-primary bg-primary/5"
                      : index < currentStep
                        ? "border-[#26A65B]/30 bg-[rgba(38,166,91,0.08)]"
                        : "border-border/60 bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Section {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-semibold">{step}</p>
                    </div>
                    {index < currentStep ? (
                      <CheckCircle2 className="h-4 w-4 text-[#26A65B]" />
                    ) : index === currentStep ? (
                      <Sparkles className="h-4 w-4 text-primary" />
                    ) : (
                      <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {index < currentStep
                      ? "Kickoff section captured"
                      : index === currentStep
                        ? "Current platform kickoff section"
                        : "Queued for provisioning handoff"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isSubmitting && submitStage && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>{submitStage}...</AlertDescription>
        </Alert>
      )}

      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-6 p-6">
          {currentStep === 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Organization mode</Label>
                <Select
                  value={formData.organizationMode}
                  onValueChange={(value: WizardData["organizationMode"]) => setField("organizationMode", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_campus">Single Campus</SelectItem>
                    <SelectItem value="multi_campus_network">Multi-Campus Network</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.organizationMode === "multi_campus_network" && (
                <>
                  <div className="space-y-2">
                    <Label>Network name</Label>
                    <Input value={formData.networkName || ""} onChange={(e) => setField("networkName", e.target.value)} />
                    {formErrors.networkName && <p className="text-xs text-destructive">{formErrors.networkName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Primary campus name</Label>
                    <Input
                      value={formData.primaryCampusName || ""}
                      onChange={(e) => setField("primaryCampusName", e.target.value)}
                      placeholder="Main Campus"
                    />
                    {formErrors.primaryCampusName && <p className="text-xs text-destructive">{formErrors.primaryCampusName}</p>}
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>{formData.organizationMode === "multi_campus_network" ? "Primary campus school name" : "School name"}</Label>
                <Input value={formData.schoolName} onChange={(e) => setField("schoolName", e.target.value)} />
                {formErrors.schoolName && <p className="text-xs text-destructive">{formErrors.schoolName}</p>}
              </div>
              <div className="space-y-2">
                <Label>School type</Label>
                <Select value={formData.schoolType} onValueChange={(value) => setField("schoolType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.schoolType && <p className="text-xs text-destructive">{formErrors.schoolType}</p>}
              </div>
              <div className="space-y-2">
                <Label>Curriculum mode</Label>
                <Select value={formData.curriculumMode} onValueChange={handleCurriculumModeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select curriculum mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single curriculum</SelectItem>
                    <SelectItem value="multi">Multiple curricula</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.curriculumMode && <p className="text-xs text-destructive">{formErrors.curriculumMode}</p>}
              </div>
              <div className="space-y-2">
                <Label>Primary curriculum</Label>
                <Select value={formData.primaryCurriculumCode} onValueChange={handlePrimaryCurriculumChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary curriculum" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_CURRICULA.map((curriculum) => (
                      <SelectItem key={curriculum.code} value={curriculum.code}>
                        {curriculum.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.primaryCurriculumCode && <p className="text-xs text-destructive">{formErrors.primaryCurriculumCode}</p>}
              </div>
              <div className="space-y-3 md:col-span-2">
                <div className="space-y-1">
                  <Label>Active curricula</Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.curriculumMode === "single"
                      ? "Choose the single curriculum this school will operate."
                      : "Select every curriculum this tenant needs at launch."}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {SCHOOL_CURRICULA.map((curriculum) => {
                    const checked = formData.activeCurriculumCodes.includes(curriculum.code);
                    return (
                      <label
                        key={curriculum.code}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
                          checked ? "border-primary bg-primary/5" : "border-border/60 bg-background"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleActiveCurriculumCode(curriculum.code)}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{curriculum.label}</span>
                            {formData.primaryCurriculumCode === curriculum.code ? (
                              <Badge variant="secondary">Primary</Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Default structure: {curriculum.defaultAcademicStructure} | Preset: {curriculum.defaultGradingPreset}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {formErrors.activeCurriculumCodes && <p className="text-xs text-destructive">{formErrors.activeCurriculumCodes}</p>}
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => {
                    setField("country", value);
                    setField("county", "");
                    if (!formData.address) {
                      setField("address", ADDRESS_OPTIONS[0]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingCountries ? "Loading countries..." : "Select country"} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {geoError && <p className="text-xs text-destructive">{geoError}</p>}
              </div>
              <div className="space-y-2">
                <Label>Region / county</Label>
                <Select value={formData.county} onValueChange={(value) => setField("county", value)}>
                  <SelectTrigger disabled={!formData.country || isLoadingRegions || regionOptions.length === 0}>
                    <SelectValue
                      placeholder={
                        !formData.country
                          ? "Select country first"
                          : isLoadingRegions
                            ? "Loading regions..."
                            : "Select region or county"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {regionOptions.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.county && <p className="text-xs text-destructive">{formErrors.county}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Physical address</Label>
                <Select value={formData.address || ""} onValueChange={(value) => setField("address", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select physical address profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_OPTIONS.map((address) => (
                      <SelectItem key={address} value={address}>
                        {address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Website subdomain</Label>
                <div className="flex items-center rounded-md border border-input bg-background">
                  <Input
                    value={websiteSubdomainValue}
                    onChange={(e) => updateWebsiteSubdomain(e.target.value)}
                    placeholder="greenfield-academy"
                    className="border-0 shadow-none focus-visible:ring-0"
                  />
                  <div className="shrink-0 border-l border-border/60 px-3 text-sm text-muted-foreground">
                    .{getRootDomain()}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Full website URL: {formData.websiteUrl || `https://school.${getRootDomain()}`}
                </p>
                {formErrors.websiteUrl && <p className="text-xs text-destructive">{formErrors.websiteUrl}</p>}
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input value={formData.logoUrl} onChange={(e) => setField("logoUrl", e.target.value)} placeholder="https://..." />
                {formErrors.logoUrl && <p className="text-xs text-destructive">{formErrors.logoUrl}</p>}
              </div>
              {formData.organizationMode === "multi_campus_network" && (
                <div className="space-y-4 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Additional campuses</Label>
                      <p className="text-xs text-muted-foreground">Draft extra campuses now. Each campus gets its own unique `{getRootDomain()}` subdomain automatically.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAdditionalCampuses((current) => [
                          ...current,
                          {
                            campusName: "",
                            schoolName: "",
                            campusCode: "",
                            subdomain: "",
                            county: formData.county,
                            country: formData.country,
                            schoolType: formData.schoolType,
                          },
                        ])
                      }
                    >
                      Add campus
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {additionalCampuses.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        No extra campuses drafted yet.
                      </div>
                    ) : (
                      additionalCampuses.map((campus, index) => (
                        <div key={`${index}-${campus.subdomain}`} className="grid gap-3 rounded-xl border p-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Campus name</Label>
                            <Input
                              value={campus.campusName}
                              onChange={(e) =>
                                setAdditionalCampuses((current) =>
                                  current.map((row, rowIndex) =>
                                    rowIndex === index ? { ...row, campusName: e.target.value } : row
                                  )
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Campus subdomain override</Label>
                            <Input
                              placeholder={createSlugSuggestion(campus.schoolName || campus.campusName) || "auto-generated"}
                              value={campus.subdomain}
                              onChange={(e) =>
                                setAdditionalCampuses((current) =>
                                  current.map((row, rowIndex) =>
                                    rowIndex === index ? { ...row, subdomain: createSlugSuggestion(e.target.value) } : row
                                  )
                                )
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Leave blank to auto-create {createSlugSuggestion(campus.schoolName || campus.campusName) || "campus"}.{getRootDomain()}.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>School name override</Label>
                            <Input
                              value={campus.schoolName}
                              onChange={(e) =>
                                setAdditionalCampuses((current) =>
                                  current.map((row, rowIndex) =>
                                    rowIndex === index ? { ...row, schoolName: e.target.value } : row
                                  )
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Campus code</Label>
                            <Input
                              value={campus.campusCode}
                              onChange={(e) =>
                                setAdditionalCampuses((current) =>
                                  current.map((row, rowIndex) =>
                                    rowIndex === index ? { ...row, campusCode: e.target.value } : row
                                  )
                                )
                              }
                            />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setAdditionalCampuses((current) => current.filter((_, rowIndex) => rowIndex !== index))
                              }
                            >
                              Remove campus
                            </Button>
                          </div>
                          {formErrors[`additionalCampus-${index}`] && (
                            <p className="md:col-span-2 text-xs text-destructive">{formErrors[`additionalCampus-${index}`]}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
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
                <Select value={formData.adminJobTitle} onValueChange={(value) => setField("adminJobTitle", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job title" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_JOB_TITLE_OPTIONS.map((title) => (
                      <SelectItem key={title} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              {planList.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No subscription plans are currently available. Add or activate at least one plan in platform billing before creating a tenant.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {planList.map((plan) => (
                    <button
                      key={plan.id ?? plan.name}
                      type="button"
                      onClick={() => {
                        setField("planId", plan.name);
                        setField(
                          "selectedModuleIds",
                          [...((plan.includedModuleIds as string[] | undefined) ?? (plan.includedModules as Array<any> | undefined)?.map((module) => String(module.id ?? module._id ?? module.name)) ?? [])]
                        );
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
                        Includes {((plan.includedModuleIds as string[] | undefined) ?? (plan.includedModules as Array<any> | undefined)?.map((module) => String(module.id ?? module._id ?? module.name)) ?? []).length} bundled module{(((plan.includedModuleIds as string[] | undefined) ?? (plan.includedModules as Array<any> | undefined)?.map((module) => String(module.id ?? module._id ?? module.name)) ?? []).length === 1 ? "" : "s")}.
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {formErrors.planId && <p className="text-xs text-destructive">{formErrors.planId}</p>}

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Billing cycle</Label>
                    <Select
                      value={formData.billingCycle}
                      onValueChange={(value: "monthly" | "quarterly" | "annual") => setField("billingCycle", value)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Termly</SelectItem>
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
                <Label>Automatic school subdomain</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.subdomain}
                    onChange={(e) => {
                      setSubdomainEdited(true);
                      setField("subdomain", createSlugSuggestion(e.target.value));
                    }}
                  />
                  <Button type="button" variant="outline" onClick={autoSuggestSubdomain}>Suggest</Button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    EduMyles provisions {formData.subdomain || createSlugSuggestion(formData.schoolName) || "school"}.{getRootDomain()} automatically. If the first choice is taken, the backend assigns the next available variant.
                  </p>
                  <p className={`text-xs font-medium ${subdomainStatusTone}`}>
                    {formData.subdomain.trim().length < 3
                      ? "A valid subdomain is generated from the school name before provisioning."
                      : subdomainAvailability === undefined
                        ? "Checking availability..."
                        : subdomainAvailability.available
                          ? subdomainAvailability.reason
                          : `${subdomainAvailability.reason} A unique fallback will be assigned automatically.`}
                  </p>
                </div>
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
                {planModuleDetails.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      The selected plan does not expose bundled modules yet. Choose another plan or add bundled modules in Billing Plans first.
                    </AlertDescription>
                  </Alert>
                ) : (
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
                )}
                {formErrors.selectedModuleIds && <p className="text-xs text-destructive">{formErrors.selectedModuleIds}</p>}
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">Additional pilot grants</h3>
                  <p className="text-sm text-muted-foreground">Choose optional marketplace modules to grant temporarily while the school completes its onboarding.</p>
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
                    <p className="text-muted-foreground">
                      Mode: {formData.organizationMode === "multi_campus_network" ? "Multi-campus network" : "Single campus"}
                    </p>
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
                    {formData.organizationMode === "multi_campus_network" ? (
                      <p className="text-muted-foreground">
                        {additionalCampuses.length} extra campus draft(s) linked to {formData.networkName || "network pending"}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  The current provisioning flow creates the tenant {formData.organizationMode === "multi_campus_network" ? "network, primary campus, optional additional campuses," : ""} WorkOS organization, subscription, onboarding record, selected installed modules, pilot grants, and a WorkOS-backed school-admin invitation.
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
                      Create Tenant & Open Setup Flow
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
              <p className="text-sm text-muted-foreground">The school admin is staged for first login and receives a WorkOS invitation linked to the tenant organization.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
