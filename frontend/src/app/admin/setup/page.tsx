"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Circle, Loader2, Plus, SkipForward, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useConvexMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

type StepKey =
  | "schoolProfile"
  | "academicYear"
  | "gradingSystem"
  | "subjects"
  | "classes"
  | "feeStructure"
  | "staffAdded"
  | "studentsAdded"
  | "modulesConfigured"
  | "portalCustomized"
  | "parentsInvited"
  | "firstAction";

type StepConfig = {
  key: StepKey;
  title: string;
  description: string;
  points: number;
  skippable?: boolean;
};

type SchoolProfileForm = {
  schoolType: string;
  boardingType: string;
  levels: string[];
  officialEmail: string;
  phone: string;
  website: string;
  county: string;
  registrationNumber: string;
  logoUrl: string;
};

type AcademicYearForm = {
  yearName: string;
  startDate: string;
  endDate: string;
  structure: string;
};

type GradingSystemForm = {
  preset: string;
  passMark: string;
  scaleLabel: string;
};

type SubjectRow = {
  name: string;
  code: string;
  department: string;
};

type ClassRow = {
  name: string;
  level: string;
  stream: string;
  capacity: string;
  academicYear: string;
};

type FeeStructureForm = {
  name: string;
  amount: string;
  academicYear: string;
  grade: string;
  frequency: string;
};

type StaffInviteRow = {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
};

type StudentRow = {
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  className: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
};

type BrandingForm = {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  footerText: string;
};

const STEP_CONFIG: StepConfig[] = [
  { key: "schoolProfile", title: "School profile", description: "Capture your school identity and official contact details.", points: 8 },
  { key: "academicYear", title: "Academic year", description: "Set the academic calendar and structure your current operating year.", points: 7 },
  { key: "gradingSystem", title: "Grading system", description: "Define how performance should be assessed before marks start flowing in.", points: 5 },
  { key: "subjects", title: "Subjects", description: "Load the subjects your teachers will work with from day one.", points: 5 },
  { key: "classes", title: "Classes", description: "Set up levels, streams, and classroom capacity.", points: 6 },
  { key: "feeStructure", title: "Fee structure", description: "Draft at least one fee structure so finance workflows have a starting point.", points: 7, skippable: true },
  { key: "staffAdded", title: "Staff", description: "Invite key staff members into the school workspace.", points: 5, skippable: true },
  { key: "studentsAdded", title: "Students", description: "Bring in your initial student roster to reach activation readiness.", points: 7 },
  { key: "modulesConfigured", title: "Modules", description: "Review recommended modules for your school profile and trial setup.", points: 0 },
  { key: "portalCustomized", title: "Customize portal", description: "Apply school branding so portals feel like your own product.", points: 0 },
  { key: "parentsInvited", title: "Parents", description: "Invite parents after student data and contacts are in place.", points: 0, skippable: true },
  { key: "firstAction", title: "First action", description: "Take the first operational action and transition into day-to-day usage.", points: 1 },
];

const SCHOOL_LEVEL_OPTIONS = [
  { value: "pre_primary", label: "Pre-Primary" },
  { value: "primary", label: "Primary (Grade 1-8)" },
  { value: "secondary", label: "Secondary (Form 1-4)" },
  { value: "junior_secondary", label: "Junior Secondary (Grade 7-9, CBC)" },
  { value: "tertiary", label: "Tertiary" },
] as const;

function createSchoolProfileForm(profile?: Partial<SchoolProfileForm>): SchoolProfileForm {
  return {
    schoolType: profile?.schoolType ?? "",
    boardingType: profile?.boardingType ?? "",
    levels: profile?.levels ?? [],
    officialEmail: profile?.officialEmail ?? "",
    phone: profile?.phone ?? "",
    website: profile?.website ?? "",
    county: profile?.county ?? "",
    registrationNumber: profile?.registrationNumber ?? "",
    logoUrl: profile?.logoUrl ?? "",
  };
}

function getSelectedLevelLabels(levels: string[]) {
  return SCHOOL_LEVEL_OPTIONS.filter((option) => levels.includes(option.value)).map((option) => option.label);
}

function createAcademicYearForm(payload?: Partial<AcademicYearForm>): AcademicYearForm {
  return {
    yearName: payload?.yearName ?? "",
    startDate: payload?.startDate ?? "",
    endDate: payload?.endDate ?? "",
    structure: payload?.structure ?? "termly",
  };
}

function createGradingSystemForm(payload?: Partial<GradingSystemForm>): GradingSystemForm {
  return {
    preset: payload?.preset ?? "kenya_secondary",
    passMark: payload?.passMark ?? "50",
    scaleLabel: payload?.scaleLabel ?? "A-E",
  };
}

function createSubjectRow(subject?: Partial<SubjectRow>): SubjectRow {
  return {
    name: subject?.name ?? "",
    code: subject?.code ?? "",
    department: subject?.department ?? "",
  };
}

function createClassRow(classRow?: Partial<ClassRow>): ClassRow {
  return {
    name: classRow?.name ?? "",
    level: classRow?.level ?? "",
    stream: classRow?.stream ?? "",
    capacity: classRow?.capacity ?? "",
    academicYear: classRow?.academicYear ?? "",
  };
}

function createFeeStructureForm(payload?: Partial<FeeStructureForm>): FeeStructureForm {
  return {
    name: payload?.name ?? "",
    amount: payload?.amount ?? "",
    academicYear: payload?.academicYear ?? "",
    grade: payload?.grade ?? "",
    frequency: payload?.frequency ?? "termly",
  };
}

function createStaffInviteRow(row?: Partial<StaffInviteRow>): StaffInviteRow {
  return {
    email: row?.email ?? "",
    firstName: row?.firstName ?? "",
    lastName: row?.lastName ?? "",
    role: row?.role ?? "teacher",
    department: row?.department ?? "",
  };
}

function createStudentRow(row?: Partial<StudentRow>): StudentRow {
  return {
    admissionNumber: row?.admissionNumber ?? "",
    firstName: row?.firstName ?? "",
    lastName: row?.lastName ?? "",
    dateOfBirth: row?.dateOfBirth ?? "",
    gender: row?.gender ?? "female",
    className: row?.className ?? "",
    guardianName: row?.guardianName ?? "",
    guardianEmail: row?.guardianEmail ?? "",
    guardianPhone: row?.guardianPhone ?? "",
  };
}

function createBrandingForm(payload?: Partial<BrandingForm>): BrandingForm {
  return {
    brandName: payload?.brandName ?? "",
    logoUrl: payload?.logoUrl ?? "",
    primaryColor: payload?.primaryColor ?? "#0F3D2E",
    secondaryColor: payload?.secondaryColor ?? "#D1A23C",
    accentColor: payload?.accentColor ?? "#1F7A52",
    footerText: payload?.footerText ?? "",
  };
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function updateSubjectRow(
  setRows: React.Dispatch<React.SetStateAction<SubjectRow[]>>,
  index: number,
  key: keyof SubjectRow,
  value: string
) {
  setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
}

function updateClassRow(
  setRows: React.Dispatch<React.SetStateAction<ClassRow[]>>,
  index: number,
  key: keyof ClassRow,
  value: string
) {
  setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
}

function updateStaffInviteRow(
  setRows: React.Dispatch<React.SetStateAction<StaffInviteRow[]>>,
  index: number,
  key: keyof StaffInviteRow,
  value: string
) {
  setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
}

function updateStudentRow(
  setRows: React.Dispatch<React.SetStateAction<StudentRow[]>>,
  index: number,
  key: keyof StudentRow,
  value: string
) {
  setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
}

export default function AdminSetupPage() {
  const { isLoading: authLoading, sessionToken, tenantId } = useAuth();
  const onboarding = useQuery(
    api.modules.platform.onboarding.getTenantOnboarding,
    sessionToken ? { sessionToken, tenantId: tenantId ?? undefined } : "skip"
  );
  const wizardContext = useQuery(
    api.modules.platform.onboarding.getSetupWizardContext,
    sessionToken ? { sessionToken, tenantId: tenantId ?? undefined } : "skip"
  );
  const marketplaceModules = useQuery(
    api.modules.marketplace.settings.getMarketplaceModules,
    sessionToken ? { sessionToken, tenantId: tenantId ?? undefined } : "skip"
  );

  const saveSchoolProfile = useConvexMutation(api.modules.platform.onboarding.saveSchoolProfileStep);
  const saveAcademicYear = useConvexMutation(api.modules.platform.onboarding.saveAcademicYearStep);
  const saveGradingSystem = useConvexMutation(api.modules.platform.onboarding.saveGradingSystemStep);
  const saveSubjects = useConvexMutation(api.modules.platform.onboarding.saveSubjectsStep);
  const saveClasses = useConvexMutation(api.modules.platform.onboarding.saveClassesStep);
  const saveFeeStructure = useConvexMutation(api.modules.platform.onboarding.saveFeeStructureStep);
  const saveStudents = useConvexMutation(api.modules.platform.onboarding.saveStudentsStep);
  const savePortalCustomization = useConvexMutation(api.modules.platform.onboarding.savePortalCustomizationStep);
  const sendParentInvites = useConvexMutation(api.modules.platform.onboarding.sendParentInvitesStep);
  const bulkInviteStaff = useConvexMutation(api.staffInvites.bulkInviteStaff);
  const updateStep = useConvexMutation(api.modules.platform.onboarding.updateOnboardingStep);
  const skipStep = useConvexMutation(api.modules.platform.onboarding.skipOnboardingStep);

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfileForm>(createSchoolProfileForm());
  const [academicYear, setAcademicYear] = useState<AcademicYearForm>(createAcademicYearForm());
  const [gradingSystem, setGradingSystemState] = useState<GradingSystemForm>(createGradingSystemForm());
  const [subjects, setSubjects] = useState<SubjectRow[]>([createSubjectRow()]);
  const [classes, setClasses] = useState<ClassRow[]>([createClassRow()]);
  const [feeStructure, setFeeStructure] = useState<FeeStructureForm>(createFeeStructureForm());
  const [staffInvites, setStaffInvites] = useState<StaffInviteRow[]>([createStaffInviteRow()]);
  const [students, setStudents] = useState<StudentRow[]>([createStudentRow()]);
  const [branding, setBranding] = useState<BrandingForm>(createBrandingForm());
  const hydrationKeyRef = useRef<string>("");

  const hydrationKey = useMemo(
    () =>
      JSON.stringify({
        tenantId: wizardContext?.tenantId ?? "",
        profile: wizardContext?.profile ?? null,
        setupData: wizardContext?.setupData ?? null,
      }),
    [wizardContext?.tenantId, wizardContext?.profile, wizardContext?.setupData]
  );

  useEffect(() => {
    if (!wizardContext) return;
    if (hydrationKeyRef.current === hydrationKey) return;
    hydrationKeyRef.current = hydrationKey;

    setSchoolProfile(
      createSchoolProfileForm({
        schoolType: wizardContext.profile?.schoolType ?? "",
        boardingType: wizardContext.profile?.boardingType ?? "",
        levels: wizardContext.profile?.levels ?? [],
        officialEmail: wizardContext.profile?.officialEmail ?? "",
        phone: wizardContext.profile?.phone ?? "",
        website: wizardContext.profile?.website ?? "",
        county: wizardContext.profile?.county ?? "",
        registrationNumber: wizardContext.profile?.registrationNumber ?? "",
        logoUrl: wizardContext.profile?.logoUrl ?? "",
      })
    );

    setAcademicYear(createAcademicYearForm(wizardContext.setupData?.academicYear ?? undefined));
    setGradingSystemState(
      createGradingSystemForm({
        preset: wizardContext.setupData?.gradingSystem?.preset,
        passMark: wizardContext.setupData?.gradingSystem?.passMark
          ? String(wizardContext.setupData.gradingSystem.passMark)
          : undefined,
        scaleLabel: wizardContext.setupData?.gradingSystem?.scaleLabel,
      })
    );
    setSubjects(
      wizardContext.setupData?.subjects?.length
        ? wizardContext.setupData.subjects.map((subject: any) => createSubjectRow(subject))
        : [createSubjectRow()]
    );
    setClasses(
      wizardContext.setupData?.classes?.length
        ? wizardContext.setupData.classes.map((classRow: any) =>
            createClassRow({
              name: classRow.name,
              level: classRow.level,
              stream: classRow.stream,
              capacity: classRow.capacity ? String(classRow.capacity) : "",
              academicYear: classRow.academicYear,
            })
          )
        : [createClassRow()]
    );
    setFeeStructure(
      createFeeStructureForm({
        name: wizardContext.setupData?.feeStructure?.name,
        amount: wizardContext.setupData?.feeStructure?.amount
          ? String(wizardContext.setupData.feeStructure.amount)
          : "",
        academicYear: wizardContext.setupData?.feeStructure?.academicYear,
        grade: wizardContext.setupData?.feeStructure?.grade,
        frequency: wizardContext.setupData?.feeStructure?.frequency,
      })
    );
    setBranding(createBrandingForm(wizardContext.setupData?.branding ?? undefined));
    setStudents(
      wizardContext.setupData?.studentsAdded?.length
        ? wizardContext.setupData.studentsAdded.map((student: any) => createStudentRow(student))
        : [createStudentRow()]
    );
  }, [hydrationKey, wizardContext]);

  useEffect(() => {
    if (onboarding?.currentStep) {
      setActiveStepIndex(Math.max(0, Math.min(STEP_CONFIG.length - 1, onboarding.currentStep - 1)));
    }
  }, [onboarding?.currentStep]);

  const stepStates = useMemo(() => onboarding?.steps ?? {}, [onboarding?.steps]);
  const completedCount = useMemo(
    () => STEP_CONFIG.filter((step) => stepStates?.[step.key]?.completed).length,
    [stepStates]
  );
  const progress = Math.round((completedCount / STEP_CONFIG.length) * 100);
  const activeStep = STEP_CONFIG[Math.max(0, Math.min(activeStepIndex, STEP_CONFIG.length - 1))]!;

  const recommendedModules = useMemo(() => {
    const moduleList = Array.isArray(marketplaceModules)
      ? marketplaceModules
      : Array.isArray((marketplaceModules as any)?.data)
        ? (marketplaceModules as any).data
        : Array.isArray((marketplaceModules as any)?.page)
          ? (marketplaceModules as any).page
          : [];
    const schoolType = schoolProfile.schoolType;
    return moduleList
      .filter((moduleRecord: any) => !moduleRecord.isCore)
      .filter((moduleRecord: any) => {
        if (!schoolType) return true;
        if (schoolType === "primary") return moduleRecord.category !== "Portals" || moduleRecord.slug === "mod_parent_portal";
        return true;
      })
      .slice(0, 8);
  }, [marketplaceModules, schoolProfile.schoolType]);

  function moveNext(currentStep?: number) {
    if (currentStep) {
      setActiveStepIndex(Math.max(0, Math.min(STEP_CONFIG.length - 1, currentStep - 1)));
      return;
    }
    setActiveStepIndex((current) => Math.min(STEP_CONFIG.length - 1, current + 1));
  }

  async function completeCurrentStep(count?: number) {
    if (!sessionToken) {
      toast.error("Your session has expired. Please refresh and try again.");
      return;
    }

    const result = await updateStep({
      sessionToken,
      tenantId: tenantId ?? undefined,
      step: activeStep.key,
      completed: true,
      count,
    });

    toast.success(
      result?.activated
        ? "Step saved and your trial is now active."
        : `${activeStep.title} saved successfully.`
    );

    if (result?.wizardCompleted) {
      window.location.assign("/admin/setup/complete");
      return;
    }

    moveNext(result?.currentStep);
  }

  async function handleSaveCurrentStep() {
    setSaving(true);
    try {
      if (!sessionToken) {
        toast.error("Your session has expired. Please refresh and try again.");
        return;
      }

      switch (activeStep.key) {
        case "schoolProfile":
          if (!schoolProfile.schoolType || !schoolProfile.boardingType || !schoolProfile.officialEmail) {
            toast.error("School type, boarding type, and official email are required.");
            return;
          }
          await saveSchoolProfile({
            sessionToken,
            tenantId: tenantId ?? undefined,
            schoolType: schoolProfile.schoolType,
            boardingType: schoolProfile.boardingType,
            levels: schoolProfile.levels,
            officialEmail: schoolProfile.officialEmail,
            phone: schoolProfile.phone,
            website: schoolProfile.website || undefined,
            county: schoolProfile.county || undefined,
            registrationNumber: schoolProfile.registrationNumber || undefined,
            logoUrl: schoolProfile.logoUrl || undefined,
          });
          await completeCurrentStep();
          return;
        case "academicYear":
          if (!academicYear.yearName || !academicYear.startDate || !academicYear.endDate) {
            toast.error("Year name, start date, and end date are required.");
            return;
          }
          await saveAcademicYear({ sessionToken, tenantId: tenantId ?? undefined, ...academicYear });
          await completeCurrentStep();
          return;
        case "gradingSystem":
          await saveGradingSystem({
            sessionToken,
            tenantId: tenantId ?? undefined,
            preset: gradingSystem.preset,
            passMark: Number(gradingSystem.passMark || 0),
            scaleLabel: gradingSystem.scaleLabel || undefined,
          });
          await completeCurrentStep();
          return;
        case "subjects": {
          const validSubjects = subjects
            .map((subject) => ({
              name: subject.name.trim(),
              code: subject.code.trim(),
              department: subject.department.trim() || undefined,
            }))
            .filter((subject) => subject.name && subject.code);
          if (validSubjects.length === 0) {
            toast.error("Add at least one subject before continuing.");
            return;
          }
          await saveSubjects({ sessionToken, tenantId: tenantId ?? undefined, subjects: validSubjects });
          await completeCurrentStep(validSubjects.length);
          return;
        }
        case "classes": {
          const validClasses = classes
            .map((classRow) => ({
              name: classRow.name.trim(),
              level: classRow.level.trim() || undefined,
              stream: classRow.stream.trim() || undefined,
              capacity: classRow.capacity ? Number(classRow.capacity) : undefined,
              academicYear: classRow.academicYear.trim() || undefined,
            }))
            .filter((classRow) => classRow.name);
          if (validClasses.length === 0) {
            toast.error("Add at least one class before continuing.");
            return;
          }
          await saveClasses({ sessionToken, tenantId: tenantId ?? undefined, classes: validClasses });
          await completeCurrentStep(validClasses.length);
          return;
        }
        case "feeStructure":
          if (!feeStructure.name || !feeStructure.amount || !feeStructure.grade || !feeStructure.academicYear) {
            toast.error("Complete the fee structure name, amount, academic year, and grade.");
            return;
          }
          await saveFeeStructure({
            sessionToken,
            tenantId: tenantId ?? undefined,
            name: feeStructure.name,
            amount: Number(feeStructure.amount),
            academicYear: feeStructure.academicYear,
            grade: feeStructure.grade,
            frequency: feeStructure.frequency,
          });
          await completeCurrentStep(1);
          return;
        case "staffAdded": {
          const validStaff = staffInvites
            .map((row) => ({
              email: row.email.trim(),
              firstName: row.firstName.trim() || undefined,
              lastName: row.lastName.trim() || undefined,
              role: row.role,
              department: row.department.trim() || undefined,
            }))
            .filter((row) => row.email);
          if (validStaff.length === 0) {
            toast.error("Add at least one staff invite before continuing, or skip this step.");
            return;
          }
          const result = await bulkInviteStaff({ sessionToken, tenantId: tenantId ?? undefined, staff: validStaff });
          if (result.failed.length > 0 && result.sent === 0) {
            toast.error(result.failed[0]?.error ?? "Failed to send staff invites.");
            return;
          }
          if (result.failed.length > 0) {
            toast.warning(`Invited ${result.sent} staff members. ${result.failed.length} could not be invited.`);
          }
          await completeCurrentStep(result.sent);
          return;
        }
        case "studentsAdded": {
          const validStudents = students
            .map((student) => ({
              admissionNumber: student.admissionNumber.trim() || undefined,
              firstName: student.firstName.trim(),
              lastName: student.lastName.trim(),
              dateOfBirth: student.dateOfBirth,
              gender: student.gender,
              className: student.className.trim() || undefined,
              guardianName: student.guardianName.trim() || undefined,
              guardianEmail: student.guardianEmail.trim() || undefined,
              guardianPhone: student.guardianPhone.trim() || undefined,
            }))
            .filter((student) => student.firstName && student.lastName && student.dateOfBirth);
          if (validStudents.length === 0) {
            toast.error("Add at least one student with name and date of birth.");
            return;
          }
          const result = await saveStudents({ sessionToken, tenantId: tenantId ?? undefined, students: validStudents });
          await completeCurrentStep(result.count);
          return;
        }
        case "modulesConfigured":
          await completeCurrentStep(recommendedModules.length);
          return;
        case "portalCustomized":
          await savePortalCustomization({
            sessionToken,
            tenantId: tenantId ?? undefined,
            brandName: branding.brandName || undefined,
            logoUrl: branding.logoUrl || undefined,
            primaryColor: branding.primaryColor || undefined,
            secondaryColor: branding.secondaryColor || undefined,
            accentColor: branding.accentColor || undefined,
            footerText: branding.footerText || undefined,
          });
          await completeCurrentStep();
          return;
        case "parentsInvited":
          {
            const result = await sendParentInvites({
              sessionToken,
              tenantId: tenantId ?? undefined,
              sendSms: true,
              sendEmail: true,
            });
            await completeCurrentStep((result.emailsSent ?? 0) + (result.smsSent ?? 0));
          }
          return;
        case "firstAction":
          toast.info("The first action step will auto-complete once you begin using the school workspace.");
          return;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save setup progress");
    } finally {
      setSaving(false);
    }
  }

  async function handleSkipCurrentStep() {
    if (!activeStep.skippable) return;
    setSaving(true);
    try {
      if (!sessionToken) {
        toast.error("Your session has expired. Please refresh and try again.");
        return;
      }

      const result = await skipStep({
        sessionToken,
        tenantId: tenantId ?? undefined,
        step: activeStep.key as "feeStructure" | "staffAdded" | "parentsInvited",
      });

      toast.success(`${activeStep.title} skipped for now.`);
      if (result?.wizardCompleted) {
        window.location.assign("/admin/setup/complete");
        return;
      }
      moveNext(result?.currentStep);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to skip this step");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || onboarding === undefined || wizardContext === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!onboarding || !wizardContext) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Setup is unavailable right now</CardTitle>
            <CardDescription>Refresh the page or sign in again to continue onboarding.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <Card className="border-slate-200/70 bg-white/90">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>{wizardContext.tenantName} Setup Wizard</CardTitle>
              <CardDescription>
                Complete onboarding step by step, activate your trial, and move into daily operations with confidence.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Health score {onboarding.healthScore}/51</Badge>
              <Badge variant={onboarding.isActivated ? "default" : "outline"}>
                {onboarding.isActivated ? "Trial active" : "Pre-activation"}
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>{completedCount} of {STEP_CONFIG.length} steps complete</span>
              <span>Current step {Math.min(activeStepIndex + 1, STEP_CONFIG.length)}</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="grid grid-cols-6 gap-2 md:grid-cols-12">
              {STEP_CONFIG.map((step, index) => {
                const completed = Boolean(stepStates?.[step.key]?.completed);
                const current = index === activeStepIndex;
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => {
                      if (index <= activeStepIndex || completed) {
                        setActiveStepIndex(index);
                      }
                    }}
                    className={`rounded-full p-1.5 ${completed ? "bg-emerald-600" : current ? "bg-amber-500" : "bg-slate-300"}`}
                    aria-label={`Go to ${step.title}`}
                  />
                );
              })}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="h-fit border-slate-200/70 bg-white/90">
          <CardHeader>
            <CardTitle className="text-base">Steps</CardTitle>
            <CardDescription>Move in order. Completed steps remain available for review and edits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {STEP_CONFIG.map((step, index) => {
              const completed = Boolean(stepStates?.[step.key]?.completed);
              const isCurrent = step.key === activeStep.key;
              return (
                <button
                  key={step.key}
                  type="button"
                  className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${isCurrent ? "border-amber-300 bg-amber-50" : "border-slate-200 hover:bg-slate-50"}`}
                  onClick={() => {
                    if (index <= activeStepIndex || completed) {
                      setActiveStepIndex(index);
                    }
                  }}
                >
                  {completed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  ) : (
                    <Circle className={`mt-0.5 h-4 w-4 ${isCurrent ? "text-amber-600" : "text-slate-400"}`} />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{index + 1}. {step.title}</span>
                      {step.skippable ? <Badge variant="outline" className="text-[10px]">Skippable</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{step.description}</p>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 bg-white/90">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>{activeStep.title}</CardTitle>
                <CardDescription>{activeStep.description}</CardDescription>
              </div>
              <Badge variant="outline">{activeStep.points} points</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeStep.key === "schoolProfile" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="School Type">
                  <Select value={schoolProfile.schoolType} onValueChange={(value) => setSchoolProfile((current) => ({ ...current, schoolType: value }))}>
                    <SelectTrigger><SelectValue placeholder="Select school type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="vocational">Vocational</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Boarding Type">
                  <Select value={schoolProfile.boardingType} onValueChange={(value) => setSchoolProfile((current) => ({ ...current, boardingType: value }))}>
                    <SelectTrigger><SelectValue placeholder="Select boarding type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="boarding">Boarding</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Levels">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-between font-normal">
                        <span className="truncate text-left">
                          {schoolProfile.levels.length > 0
                            ? getSelectedLevelLabels(schoolProfile.levels).join(", ")
                            : "Select school levels"}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-3" align="start">
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-900">School Levels</p>
                        <div className="space-y-2">
                          {SCHOOL_LEVEL_OPTIONS.map((option) => {
                            const checked = schoolProfile.levels.includes(option.value);
                            return (
                              <label key={option.value} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(nextChecked) => {
                                    setSchoolProfile((current) => ({
                                      ...current,
                                      levels: nextChecked
                                        ? [...current.levels, option.value]
                                        : current.levels.filter((level) => level !== option.value),
                                    }));
                                  }}
                                />
                                <span className="text-sm text-slate-700">{option.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </Field>
                <Field label="Official Email">
                  <Input type="email" value={schoolProfile.officialEmail} onChange={(event) => setSchoolProfile((current) => ({ ...current, officialEmail: event.target.value }))} />
                </Field>
                <Field label="Phone">
                  <Input value={schoolProfile.phone} onChange={(event) => setSchoolProfile((current) => ({ ...current, phone: event.target.value }))} />
                </Field>
                <Field label="Website">
                  <Input value={schoolProfile.website} onChange={(event) => setSchoolProfile((current) => ({ ...current, website: event.target.value }))} placeholder="https://school.example" />
                </Field>
                <Field label="County">
                  <Input value={schoolProfile.county} onChange={(event) => setSchoolProfile((current) => ({ ...current, county: event.target.value }))} />
                </Field>
                <Field label="Registration Number">
                  <Input value={schoolProfile.registrationNumber} onChange={(event) => setSchoolProfile((current) => ({ ...current, registrationNumber: event.target.value }))} />
                </Field>
                <Field label="Logo URL" className="md:col-span-2">
                  <Input value={schoolProfile.logoUrl} onChange={(event) => setSchoolProfile((current) => ({ ...current, logoUrl: event.target.value }))} placeholder="https://..." />
                </Field>
              </div>
            ) : null}

            {activeStep.key === "academicYear" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Year Name">
                  <Input value={academicYear.yearName} onChange={(event) => setAcademicYear((current) => ({ ...current, yearName: event.target.value }))} placeholder="2026 Academic Year" />
                </Field>
                <Field label="Structure">
                  <Select value={academicYear.structure} onValueChange={(value) => setAcademicYear((current) => ({ ...current, structure: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="termly">3 Terms</SelectItem>
                      <SelectItem value="semester">2 Semesters</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Start Date">
                  <Input type="date" value={academicYear.startDate} onChange={(event) => setAcademicYear((current) => ({ ...current, startDate: event.target.value }))} />
                </Field>
                <Field label="End Date">
                  <Input type="date" value={academicYear.endDate} onChange={(event) => setAcademicYear((current) => ({ ...current, endDate: event.target.value }))} />
                </Field>
              </div>
            ) : null}

            {activeStep.key === "gradingSystem" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Preset">
                  <Select value={gradingSystem.preset} onValueChange={(value) => setGradingSystemState((current) => ({ ...current, preset: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kenya_secondary">Kenya Secondary</SelectItem>
                      <SelectItem value="cbc_primary">Kenya CBC Primary</SelectItem>
                      <SelectItem value="percentage">Percentage Scale</SelectItem>
                      <SelectItem value="gpa">GPA</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Pass Mark (%)">
                  <Input type="number" value={gradingSystem.passMark} onChange={(event) => setGradingSystemState((current) => ({ ...current, passMark: event.target.value }))} />
                </Field>
                <Field label="Scale Label" className="md:col-span-2">
                  <Input value={gradingSystem.scaleLabel} onChange={(event) => setGradingSystemState((current) => ({ ...current, scaleLabel: event.target.value }))} placeholder="A-E, A-D, GPA 4.0" />
                </Field>
              </div>
            ) : null}

            {activeStep.key === "subjects" ? (
              <div className="space-y-4">
                {subjects.map((subject, index) => (
                  <div key={index} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[1.2fr_0.8fr_1fr_auto]">
                    <Field label="Subject Name">
                      <Input value={subject.name} onChange={(event) => updateSubjectRow(setSubjects, index, "name", event.target.value)} placeholder="Mathematics" />
                    </Field>
                    <Field label="Code">
                      <Input value={subject.code} onChange={(event) => updateSubjectRow(setSubjects, index, "code", event.target.value)} placeholder="MATH" />
                    </Field>
                    <Field label="Department">
                      <Input value={subject.department} onChange={(event) => updateSubjectRow(setSubjects, index, "department", event.target.value)} placeholder="Sciences" />
                    </Field>
                    <div className="flex items-end">
                      <Button type="button" variant="outline" size="icon" onClick={() => setSubjects((current) => current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => setSubjects((current) => [...current, createSubjectRow()])}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subject
                </Button>
              </div>
            ) : null}

            {activeStep.key === "classes" ? (
              <div className="space-y-4">
                {classes.map((classRow, index) => (
                  <div key={index} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-5">
                    <Field label="Class Name">
                      <Input value={classRow.name} onChange={(event) => updateClassRow(setClasses, index, "name", event.target.value)} placeholder="Form 1 East" />
                    </Field>
                    <Field label="Level">
                      <Input value={classRow.level} onChange={(event) => updateClassRow(setClasses, index, "level", event.target.value)} placeholder="Form 1" />
                    </Field>
                    <Field label="Stream">
                      <Input value={classRow.stream} onChange={(event) => updateClassRow(setClasses, index, "stream", event.target.value)} placeholder="East" />
                    </Field>
                    <Field label="Capacity">
                      <Input type="number" value={classRow.capacity} onChange={(event) => updateClassRow(setClasses, index, "capacity", event.target.value)} placeholder="40" />
                    </Field>
                    <Field label="Academic Year">
                      <Input value={classRow.academicYear} onChange={(event) => updateClassRow(setClasses, index, "academicYear", event.target.value)} placeholder={academicYear.yearName || "2026"} />
                    </Field>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setClasses((current) => [...current, createClassRow({ academicYear: academicYear.yearName })])}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Class
                  </Button>
                  {classes.length > 1 ? (
                    <Button type="button" variant="ghost" onClick={() => setClasses((current) => current.slice(0, -1))}>
                      Remove Last
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {activeStep.key === "feeStructure" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Fee Structure Name">
                  <Input value={feeStructure.name} onChange={(event) => setFeeStructure((current) => ({ ...current, name: event.target.value }))} placeholder="Day Scholar Term 1" />
                </Field>
                <Field label="Amount (KES)">
                  <Input type="number" value={feeStructure.amount} onChange={(event) => setFeeStructure((current) => ({ ...current, amount: event.target.value }))} placeholder="25000" />
                </Field>
                <Field label="Academic Year">
                  <Input value={feeStructure.academicYear} onChange={(event) => setFeeStructure((current) => ({ ...current, academicYear: event.target.value }))} placeholder={academicYear.yearName || "2026"} />
                </Field>
                <Field label="Grade / Level">
                  <Input value={feeStructure.grade} onChange={(event) => setFeeStructure((current) => ({ ...current, grade: event.target.value }))} placeholder="Form 1" />
                </Field>
                <Field label="Frequency" className="md:col-span-2">
                  <Select value={feeStructure.frequency} onValueChange={(value) => setFeeStructure((current) => ({ ...current, frequency: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="termly">Termly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            ) : null}

            {activeStep.key === "staffAdded" ? (
              <div className="space-y-4">
                {staffInvites.map((invite, index) => (
                  <div key={index} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-5">
                    <Field label="Email">
                      <Input type="email" value={invite.email} onChange={(event) => updateStaffInviteRow(setStaffInvites, index, "email", event.target.value)} placeholder="teacher@school.ac.ke" />
                    </Field>
                    <Field label="First Name">
                      <Input value={invite.firstName} onChange={(event) => updateStaffInviteRow(setStaffInvites, index, "firstName", event.target.value)} />
                    </Field>
                    <Field label="Last Name">
                      <Input value={invite.lastName} onChange={(event) => updateStaffInviteRow(setStaffInvites, index, "lastName", event.target.value)} />
                    </Field>
                    <Field label="Role">
                      <Select value={invite.role} onValueChange={(value) => updateStaffInviteRow(setStaffInvites, index, "role", value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="principal">Principal</SelectItem>
                          <SelectItem value="bursar">Bursar</SelectItem>
                          <SelectItem value="hr_manager">HR Manager</SelectItem>
                          <SelectItem value="librarian">Librarian</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Department">
                      <Input value={invite.department} onChange={(event) => updateStaffInviteRow(setStaffInvites, index, "department", event.target.value)} />
                    </Field>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => setStaffInvites((current) => [...current, createStaffInviteRow()])}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Staff Invite
                </Button>
                {wizardContext.setupData?.staffInvites?.length ? (
                  <p className="text-sm text-slate-500">{wizardContext.setupData.staffInvites.length} pending invite(s) already exist for this school.</p>
                ) : null}
              </div>
            ) : null}

            {activeStep.key === "studentsAdded" ? (
              <div className="space-y-4">
                {students.map((student, index) => (
                  <div key={index} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-3">
                    <Field label="Admission Number">
                      <Input value={student.admissionNumber} onChange={(event) => updateStudentRow(setStudents, index, "admissionNumber", event.target.value)} />
                    </Field>
                    <Field label="First Name">
                      <Input value={student.firstName} onChange={(event) => updateStudentRow(setStudents, index, "firstName", event.target.value)} />
                    </Field>
                    <Field label="Last Name">
                      <Input value={student.lastName} onChange={(event) => updateStudentRow(setStudents, index, "lastName", event.target.value)} />
                    </Field>
                    <Field label="Date of Birth">
                      <Input type="date" value={student.dateOfBirth} onChange={(event) => updateStudentRow(setStudents, index, "dateOfBirth", event.target.value)} />
                    </Field>
                    <Field label="Gender">
                      <Select value={student.gender} onValueChange={(value) => updateStudentRow(setStudents, index, "gender", value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Class Name">
                      <Input value={student.className} onChange={(event) => updateStudentRow(setStudents, index, "className", event.target.value)} placeholder="Form 1 East" />
                    </Field>
                    <Field label="Guardian Name">
                      <Input value={student.guardianName} onChange={(event) => updateStudentRow(setStudents, index, "guardianName", event.target.value)} />
                    </Field>
                    <Field label="Guardian Email">
                      <Input type="email" value={student.guardianEmail} onChange={(event) => updateStudentRow(setStudents, index, "guardianEmail", event.target.value)} />
                    </Field>
                    <Field label="Guardian Phone">
                      <Input value={student.guardianPhone} onChange={(event) => updateStudentRow(setStudents, index, "guardianPhone", event.target.value)} />
                    </Field>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => setStudents((current) => [...current, createStudentRow()])}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </div>
            ) : null}

            {activeStep.key === "modulesConfigured" ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Recommended modules are free during trial. Review the suggestions below, then continue to keep onboarding moving.
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {recommendedModules.map((moduleRecord: any) => (
                    <div key={moduleRecord.slug} className="rounded-2xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-medium">{moduleRecord.name}</h3>
                          <p className="text-sm text-slate-500">{moduleRecord.tagline}</p>
                        </div>
                        <Badge variant={moduleRecord.installed ? "default" : "outline"}>
                          {moduleRecord.installed ? moduleRecord.installed.status : "not installed"}
                        </Badge>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">{moduleRecord.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeStep.key === "portalCustomized" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Brand Name">
                  <Input value={branding.brandName} onChange={(event) => setBranding((current) => ({ ...current, brandName: event.target.value }))} placeholder={wizardContext.tenantName} />
                </Field>
                <Field label="Logo URL">
                  <Input value={branding.logoUrl} onChange={(event) => setBranding((current) => ({ ...current, logoUrl: event.target.value }))} placeholder="https://..." />
                </Field>
                <Field label="Primary Color">
                  <Input value={branding.primaryColor} onChange={(event) => setBranding((current) => ({ ...current, primaryColor: event.target.value }))} placeholder="#0F3D2E" />
                </Field>
                <Field label="Secondary Color">
                  <Input value={branding.secondaryColor} onChange={(event) => setBranding((current) => ({ ...current, secondaryColor: event.target.value }))} placeholder="#D1A23C" />
                </Field>
                <Field label="Accent Color">
                  <Input value={branding.accentColor} onChange={(event) => setBranding((current) => ({ ...current, accentColor: event.target.value }))} placeholder="#1F7A52" />
                </Field>
                <Field label="Footer Text" className="md:col-span-2">
                  <Textarea value={branding.footerText} onChange={(event) => setBranding((current) => ({ ...current, footerText: event.target.value }))} placeholder="Powered by EduMyles for Riverside Secondary School" />
                </Field>
              </div>
            ) : null}

            {activeStep.key === "parentsInvited" ? (
              <div className="space-y-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <p className="text-sm text-slate-700">
                  Invite parents using the guardian contacts already captured from your student roster. EduMyles will create pending parent access and send activation links by email and SMS where available.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Guardian contacts</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{wizardContext.setupData?.studentsAdded?.length ?? 0}</p>
                    <p className="mt-1 text-sm text-slate-500">students captured in onboarding</p>
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Delivery</p>
                    <p className="mt-2 text-sm text-slate-700">Email + SMS are sent automatically when contact details are present.</p>
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Join route</p>
                    <p className="mt-2 text-sm text-slate-700 font-medium">/join/{wizardContext.tenantSlug}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {activeStep.key === "firstAction" ? (
              <div className="space-y-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <p className="text-sm text-slate-700">
                  This final step now completes automatically after the first real attendance mark, invoice creation, or academic assignment in the live workspace.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={() => window.location.assign("/admin/academics")}>
                    Post Assignment
                  </Button>
                  <Button type="button" variant="outline" onClick={() => window.location.assign("/admin/finance/invoices/create")}>
                    Create Fee Invoice
                  </Button>
                  <Button type="button" variant="outline" onClick={() => window.location.assign("/portal/teacher/attendance")}>
                    Mark Attendance
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setActiveStepIndex((current) => Math.max(0, current - 1))} disabled={activeStepIndex === 0 || saving}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button variant="ghost" onClick={() => window.location.assign("/admin")} disabled={saving}>
                  Save & Continue Later
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeStep.skippable ? (
                  <Button variant="outline" onClick={handleSkipCurrentStep} disabled={saving}>
                    <SkipForward className="mr-2 h-4 w-4" />
                    Skip for now
                  </Button>
                ) : null}
                <Button onClick={handleSaveCurrentStep} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Save & Continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
