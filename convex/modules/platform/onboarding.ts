import { internalMutation, mutation, query } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { requireTenantSession } from "../../helpers/tenantGuard";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

const onboardingStepNames = [
  "schoolProfile",
  "academicYear",
  "gradingSystem",
  "subjects",
  "classes",
  "feeStructure",
  "staffAdded",
  "studentsAdded",
  "modulesConfigured",
  "portalCustomized",
  "parentsInvited",
  "firstAction",
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_INTERVENTION_TRIGGERS = [
  { day: 1, trigger: "day_1" as const },
  { day: 3, trigger: "day_3" as const },
  { day: 7, trigger: "day_7" as const },
  { day: 10, trigger: "day_10" as const },
  { day: 12, trigger: "day_12" as const },
  { day: 13, trigger: "day_13" as const },
  { day: 14, trigger: "day_14" as const },
];

type OnboardingStepName = (typeof onboardingStepNames)[number];

type StepState = {
  completed: boolean;
  completedAt?: number;
  count?: number;
  pointsAwarded: number;
};

type StepMap = Record<OnboardingStepName, StepState>;
type StepPayloadMap = {
  schoolProfile?: {
    schoolType?: string;
    levels?: string[];
    boardingType?: string;
    officialEmail?: string;
    phone?: string;
    website?: string;
    county?: string;
    registrationNumber?: string;
    logoUrl?: string;
  };
  academicYear?: {
    yearName: string;
    startDate: string;
    endDate: string;
    structure: string;
  };
  gradingSystem?: {
    preset: string;
    passMark: number;
    scaleLabel?: string;
  };
  subjects?: Array<{
    name: string;
    code: string;
    department?: string;
  }>;
  classes?: Array<{
    name: string;
    level?: string;
    stream?: string;
    capacity?: number;
    academicYear?: string;
  }>;
  feeStructure?: {
    name: string;
    amount: number;
    academicYear: string;
    grade: string;
    frequency: string;
  };
  staffAdded?: Array<{
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    department?: string;
  }>;
  studentsAdded?: Array<{
    admissionNumber?: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    className?: string;
    guardianName?: string;
    guardianEmail?: string;
    guardianPhone?: string;
  }>;
  portalCustomized?: {
    brandName?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    footerText?: string;
  };
};

const STEP_POINTS: Record<OnboardingStepName, number> = {
  schoolProfile: 8,
  academicYear: 7,
  gradingSystem: 5,
  subjects: 5,
  classes: 6,
  feeStructure: 7,
  staffAdded: 5,
  studentsAdded: 7,
  modulesConfigured: 0,
  portalCustomized: 0,
  parentsInvited: 0,
  firstAction: 1,
};

const STEP_TITLES: Record<OnboardingStepName, string> = {
  schoolProfile: "School profile",
  academicYear: "Academic year",
  gradingSystem: "Grading system",
  subjects: "Subjects",
  classes: "Classes",
  feeStructure: "Fee structure",
  staffAdded: "Staff",
  studentsAdded: "Students",
  modulesConfigured: "Modules",
  portalCustomized: "Customize portal",
  parentsInvited: "Parents",
  firstAction: "First action",
};

const TRIAL_INTERVENTION_COPY: Record<
  (typeof TRIAL_INTERVENTION_TRIGGERS)[number]["trigger"],
  { title: string; emailSubject: string; message: string; smsMessage?: string }
> = {
  day_1: {
    title: "Welcome to your EduMyles trial",
    emailSubject: "Welcome to your EduMyles trial",
    message: "Your trial is live. Start by finishing setup so your school can get value quickly.",
  },
  day_3: {
    title: "How is setup going?",
    emailSubject: "How is setup going on EduMyles?",
    message: "You are three days into your trial. Complete the next wizard steps to unlock more value.",
  },
  day_7: {
    title: "You are halfway through your trial",
    emailSubject: "You are halfway through your EduMyles trial",
    message: "Your team is halfway through the EduMyles trial. Review your modules and billing options early.",
  },
  day_10: {
    title: "Seven days left in your trial",
    emailSubject: "Seven days left in your EduMyles trial",
    message: "You have seven days left. Choose a plan now to avoid interruptions when the trial ends.",
  },
  day_12: {
    title: "Account manager check-in",
    emailSubject: "Your EduMyles account manager is ready to help",
    message: "Your trial is nearing the finish line. An account manager can help you convert smoothly.",
  },
  day_13: {
    title: "Your trial ends tomorrow",
    emailSubject: "Your EduMyles trial ends tomorrow",
    message: "Tomorrow is the final day of your trial. Choose a plan today to keep your modules active.",
    smsMessage: "EduMyles: your school trial ends tomorrow. Open billing and choose a plan to avoid module suspension.",
  },
  day_14: {
    title: "Last day of your trial",
    emailSubject: "Last day of your EduMyles trial",
    message: "Today is the last day of your trial. Choose a plan now to keep access to non-core modules.",
    smsMessage: "EduMyles: this is the last day of your trial. Choose a plan now to keep access active.",
  },
};

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function getTrialTemplateKey(trigger: (typeof TRIAL_INTERVENTION_TRIGGERS)[number]["trigger"]) {
  switch (trigger) {
    case "day_3":
      return "trial_day3_checkin";
    case "day_7":
      return "trial_day7_halfway";
    case "day_10":
      return "trial_day10_nudge";
    case "day_12":
      return "trial_day12_outreach";
    case "day_13":
      return "trial_day13_urgent";
    case "day_14":
      return "trial_expired";
    default:
      return undefined;
  }
}

const NUDGE_TEMPLATE_MAP = {
  stalled_onboarding: {
    label: "General stalled onboarding",
    description: "Default reminder for schools that stopped progressing in setup.",
    message:
      "Your EduMyles onboarding is waiting on the next setup step. Pick up where you left off and complete the wizard to keep momentum high.",
  },
  stalled_step_1: {
    label: "Stalled at school profile",
    description: "Nudge the school to complete school identity and contact details.",
    message:
      "Your school setup is still waiting on the school profile step. Add the core school identity details so the rest of onboarding can continue smoothly.",
  },
  stalled_step_2: {
    label: "Stalled at academic year",
    description: "Prompt the school to define the live academic calendar.",
    message:
      "Your setup is waiting on the academic year step. Set your working academic calendar so classes, subjects, and reporting can line up correctly.",
  },
  stalled_step_3: {
    label: "Stalled at grading system",
    description: "Prompt the school to choose a grading approach.",
    message:
      "Your onboarding is paused at grading system setup. Choose a grading model so teachers can begin working with consistent academic rules.",
  },
  stalled_step_4: {
    label: "Stalled at subjects",
    description: "Prompt the school to load subjects.",
    message:
      "Your onboarding is paused at the subjects step. Add your subject catalog so classes and teaching workflows can move forward.",
  },
  stalled_step_5: {
    label: "Stalled at classes",
    description: "Prompt the school to define classes and streams.",
    message:
      "Your onboarding is waiting on class setup. Add levels and streams so students and academic workflows can be mapped correctly.",
  },
  stalled_step_6: {
    label: "Stalled at fee structure",
    description: "Prompt the school to draft fee structure details.",
    message:
      "Your onboarding is paused at fee structure setup. Draft at least one fee structure so finance workflows are ready when you need them.",
  },
  stalled_step_7: {
    label: "Stalled at staff invites",
    description: "Prompt the school to bring staff into the workspace.",
    message:
      "Your onboarding is waiting on staff setup. Invite key team members so EduMyles can be configured collaboratively instead of by one person alone.",
  },
  stalled_step_8: {
    label: "Stalled at students",
    description: "Prompt the school to load the initial student roster.",
    message:
      "Your onboarding is waiting on student setup. Import your first set of students so the school can unlock real day-to-day value from the platform.",
  },
  stalled_step_9: {
    label: "Stalled at modules",
    description: "Prompt the school to review modules during trial.",
    message:
      "Your onboarding is paused at modules review. Confirm the modules your school needs during trial so the team can explore the right workflows early.",
  },
  stalled_step_10: {
    label: "Stalled at portal branding",
    description: "Prompt the school to customize branding.",
    message:
      "Your onboarding is waiting on portal customization. Apply your school branding so the experience feels ready for students, staff, and parents.",
  },
  stalled_step_11: {
    label: "Stalled at parent invites",
    description: "Prompt the school to invite parents.",
    message:
      "Your onboarding is paused at parent invites. Invite parents once contacts are ready so your school can test real family communication flows.",
  },
  stalled_step_12: {
    label: "Stalled at first action",
    description: "Prompt the school to complete a first real action.",
    message:
      "Your onboarding is one step away from completion. Take the first real action in EduMyles so the school can transition from setup into live usage.",
  },
  almost_converted: {
    label: "Almost converted",
    description: "Encourage schools close to activation or conversion.",
    message:
      "Your school is very close to full activation. Complete the remaining setup work now so your team can convert the trial momentum into an active rollout.",
  },
  trial_follow_up: {
    label: "Trial follow-up",
    description: "General success reminder during trial.",
    message:
      "Your EduMyles trial is active. Continue setup now so your team reaches value quickly and is ready to choose the right plan before trial expiry.",
  },
} as const;

function buildDefaultSteps(): StepMap {
  return {
    schoolProfile: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    academicYear: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    gradingSystem: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    subjects: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    classes: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    feeStructure: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    staffAdded: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    studentsAdded: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    modulesConfigured: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    portalCustomized: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    parentsInvited: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
    firstAction: { completed: false, completedAt: undefined, count: undefined, pointsAwarded: 0 },
  };
}

function normalizeLegacySteps(steps: any | undefined): StepMap {
  const defaults = buildDefaultSteps();
  if (!steps || typeof steps !== "object") {
    return defaults;
  }

  return {
    schoolProfile: {
      ...defaults.schoolProfile,
      ...(steps.schoolProfile ?? {}),
      pointsAwarded: steps.schoolProfile?.pointsAwarded ?? defaults.schoolProfile.pointsAwarded,
    },
    academicYear: {
      ...defaults.academicYear,
      ...(steps.academicYear ?? {}),
      pointsAwarded: steps.academicYear?.pointsAwarded ?? defaults.academicYear.pointsAwarded,
    },
    gradingSystem: {
      ...defaults.gradingSystem,
      ...(steps.gradingSystem ?? {}),
      pointsAwarded: steps.gradingSystem?.pointsAwarded ?? defaults.gradingSystem.pointsAwarded,
    },
    subjects: {
      ...defaults.subjects,
      ...(steps.subjects ?? {}),
      pointsAwarded: steps.subjects?.pointsAwarded ?? defaults.subjects.pointsAwarded,
    },
    classes: {
      ...defaults.classes,
      completed: steps.classes?.completed ?? steps.classesCreated?.completed ?? false,
      completedAt: steps.classes?.completedAt ?? steps.classesCreated?.completedAt,
      count: steps.classes?.count ?? steps.classesCreated?.count,
      pointsAwarded: steps.classes?.pointsAwarded ?? steps.classesCreated?.pointsAwarded ?? 0,
    },
    feeStructure: {
      ...defaults.feeStructure,
      ...(steps.feeStructure ?? {}),
      pointsAwarded: steps.feeStructure?.pointsAwarded ?? defaults.feeStructure.pointsAwarded,
    },
    staffAdded: {
      ...defaults.staffAdded,
      ...(steps.staffAdded ?? {}),
      pointsAwarded: steps.staffAdded?.pointsAwarded ?? defaults.staffAdded.pointsAwarded,
    },
    studentsAdded: {
      ...defaults.studentsAdded,
      ...(steps.studentsAdded ?? {}),
      pointsAwarded: steps.studentsAdded?.pointsAwarded ?? defaults.studentsAdded.pointsAwarded,
    },
    modulesConfigured: {
      ...defaults.modulesConfigured,
      ...(steps.modulesConfigured ?? {}),
      pointsAwarded: steps.modulesConfigured?.pointsAwarded ?? defaults.modulesConfigured.pointsAwarded,
    },
    portalCustomized: {
      ...defaults.portalCustomized,
      ...(steps.portalCustomized ?? {}),
      pointsAwarded: steps.portalCustomized?.pointsAwarded ?? defaults.portalCustomized.pointsAwarded,
    },
    parentsInvited: {
      ...defaults.parentsInvited,
      ...(steps.parentsInvited ?? {}),
      pointsAwarded: steps.parentsInvited?.pointsAwarded ?? defaults.parentsInvited.pointsAwarded,
    },
    firstAction: {
      ...defaults.firstAction,
      completed: steps.firstAction?.completed ?? steps.firstPaymentProcessed?.completed ?? false,
      completedAt: steps.firstAction?.completedAt ?? steps.firstPaymentProcessed?.completedAt,
      count: steps.firstAction?.count ?? steps.firstPaymentProcessed?.count,
      pointsAwarded: steps.firstAction?.pointsAwarded ?? steps.firstPaymentProcessed?.pointsAwarded ?? 0,
    },
  };
}

function calculateHealthScore(steps: StepMap) {
  return onboardingStepNames.reduce((sum, stepName) => sum + (steps[stepName].pointsAwarded ?? 0), 0);
}

function normalizeStepPayloads(stepPayloads: any | undefined): StepPayloadMap {
  if (!stepPayloads || typeof stepPayloads !== "object") {
    return {};
  }
  return stepPayloads as StepPayloadMap;
}

function getCurrentStep(steps: StepMap) {
  const nextIndex = onboardingStepNames.findIndex((stepName) => !steps[stepName].completed);
  return nextIndex === -1 ? onboardingStepNames.length : nextIndex + 1;
}

function getCurrentStepLabel(stepNumber?: number) {
  if (!stepNumber || stepNumber < 1 || stepNumber > onboardingStepNames.length) {
    return "Completed";
  }
  const stepKey = (onboardingStepNames[stepNumber - 1] ??
    onboardingStepNames[onboardingStepNames.length - 1]) as OnboardingStepName;
  return STEP_TITLES[stepKey];
}

function getInitials(firstName?: string, lastName?: string, email?: string) {
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (combined) {
    return combined
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }
  return (email ?? "?").slice(0, 2).toUpperCase();
}

function getNudgeTemplateMessage(template: string, stepNumber?: number) {
  if (template === "stalled_step_auto" && stepNumber) {
    const autoKey = `stalled_step_${Math.min(Math.max(stepNumber, 1), onboardingStepNames.length)}` as keyof typeof NUDGE_TEMPLATE_MAP;
    return {
      templateKey: autoKey,
      ...NUDGE_TEMPLATE_MAP[autoKey],
    };
  }

  const fallbackKey = "stalled_onboarding" as const;
  const chosenKey = (template in NUDGE_TEMPLATE_MAP ? template : fallbackKey) as keyof typeof NUDGE_TEMPLATE_MAP;
  return {
    templateKey: chosenKey,
    ...NUDGE_TEMPLATE_MAP[chosenKey],
  };
}

async function createOnboardingNotification(
  ctx: any,
  tenantId: string,
  userId: string,
  title: string,
  message: string,
  link = "/admin/setup"
) {
  await ctx.db.insert("notifications", {
    tenantId,
    userId,
    title,
    message,
    type: "onboarding",
    isRead: false,
    link,
    createdAt: Date.now(),
  });
}

async function getTenantRecord(ctx: any, tenantId: string) {
  return await ctx.db
    .query("tenants")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId))
    .first();
}

async function getTrialSubscription(ctx: any, tenantId: string) {
  return await ctx.db
    .query("tenant_subscriptions")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId))
    .first();
}

async function getSchoolAdmins(ctx: any, tenantId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_tenant_role", (q: any) => q.eq("tenantId", tenantId).eq("role", "school_admin"))
    .collect();
}

function getInterventionAlreadySent(
  interventionsSent: Array<{ type: string; sentAt: number; channel: string }> | undefined,
  trigger: (typeof TRIAL_INTERVENTION_TRIGGERS)[number]["trigger"],
  channel: string
) {
  return Boolean(
    interventionsSent?.some((entry) => entry.type === trigger && entry.channel === channel)
  );
}

function slugifyFallbackTenantName(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "school";
}

function createInviteToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

async function markFirstActionCompleted(
  ctx: any,
  args: {
    tenantId: string;
    userId?: string;
    source: "attendance" | "invoice" | "assignment";
    count?: number;
  }
) {
  const now = Date.now();
  const onboarding = await ensureOnboardingRecord(ctx, args.tenantId);
  const steps = normalizeLegacySteps(onboarding?.steps);

  if (steps.firstAction.completed) {
    return {
      success: true,
      alreadyCompleted: true,
      healthScore: calculateHealthScore(steps),
      currentStep: getCurrentStep(steps),
      wizardCompleted: onboarding.wizardCompleted ?? false,
    };
  }

  steps.firstAction = {
    completed: true,
    completedAt: now,
    count: args.count ?? 1,
    pointsAwarded: STEP_POINTS.firstAction,
  };

  const wizardCompleted = onboardingStepNames.every((stepName) => steps[stepName].completed);
  const healthScore = calculateHealthScore(steps);
  const currentStep = getCurrentStep(steps);

  await ctx.db.patch(onboarding._id, {
    steps,
    wizardCompleted,
    wizardCompletedAt: wizardCompleted ? now : onboarding.wizardCompletedAt,
    currentStep,
    healthScore,
    lastActivityAt: now,
    stalled: false,
    isStalled: false,
    stalledSince: undefined,
    stalledAtStep: undefined,
    updatedAt: now,
  });

  if (args.userId) {
    await createOnboardingNotification(
      ctx,
      args.tenantId,
      args.userId,
      "First operational action complete",
      `Your school recorded its first live ${args.source} action in EduMyles.`,
      "/admin"
    );
  }

  return {
    success: true,
    healthScore,
    currentStep,
    wizardCompleted,
  };
}

async function ensureTenantRecord(ctx: any, tenant: { tenantId: string; email: string }) {
  const existing = await ctx.db
    .query("tenants")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenant.tenantId))
    .first();

  if (existing) {
    return existing;
  }

  const baseName = tenant.email.split("@")[0] || tenant.tenantId;
  const baseSubdomain = slugifyFallbackTenantName(baseName);
  let subdomain = baseSubdomain;
  let suffix = 2;

  while (true) {
    const conflicting = await ctx.db
      .query("tenants")
      .withIndex("by_subdomain", (q: any) => q.eq("subdomain", subdomain))
      .first();
    if (!conflicting) {
      break;
    }
    subdomain = `${baseSubdomain}-${suffix}`;
    suffix += 1;
  }

  const now = Date.now();
  const tenantDocId = await ctx.db.insert("tenants", {
    tenantId: tenant.tenantId,
    name: `${baseName} School`,
    subdomain,
    workosOrgId: undefined,
    email: tenant.email,
    phone: "",
    website: undefined,
    registrationNumber: undefined,
    logoUrl: undefined,
    plan: "starter",
    status: "pending_setup",
    schoolType: undefined,
    levels: undefined,
    boardingType: undefined,
    county: "Unknown",
    country: "Kenya",
    trialStartedAt: undefined,
    trialEndsAt: undefined,
    activatedAt: undefined,
    engagementScore: 0,
    isVatExempt: false,
    resellerId: undefined,
    inviteId: undefined,
    suspendedAt: undefined,
    suspendReason: undefined,
    createdAt: now,
    updatedAt: now,
  });

  return await ctx.db.get(tenantDocId);
}

async function ensureOnboardingRecord(ctx: any, tenantId: string) {
  const existing = await ctx.db
    .query("tenant_onboarding")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId))
    .first();

  if (existing) {
    return existing;
  }

  const now = Date.now();
  const onboardingId = await ctx.db.insert("tenant_onboarding", {
    tenantId,
    wizardCompleted: false,
    wizardCompletedAt: undefined,
    currentStep: 1,
    isActivated: false,
    steps: buildDefaultSteps(),
    stepPayloads: {},
    healthScore: 0,
    lastActivityAt: now,
    stalled: false,
    isStalled: false,
    stalledSince: undefined,
    stalledAtStep: undefined,
    assignedAccountManager: undefined,
    interventionsSent: [],
    createdAt: now,
    updatedAt: now,
  });

  return await ctx.db.get(onboardingId);
}

async function sendTrialInterventionHelper(
  ctx: any,
  args: {
    tenantId: string;
    trigger: (typeof TRIAL_INTERVENTION_TRIGGERS)[number]["trigger"];
  }
) {
  const now = Date.now();
  const [tenantRecord, subscription, onboarding, schoolAdmins] = await Promise.all([
    getTenantRecord(ctx, args.tenantId),
    getTrialSubscription(ctx, args.tenantId),
    ensureOnboardingRecord(ctx, args.tenantId),
    getSchoolAdmins(ctx, args.tenantId),
  ]);

  if (!tenantRecord || !subscription) {
    return { success: false, reason: "tenant_or_subscription_missing" };
  }

  if (tenantRecord.status !== "trial" || subscription.status !== "trialing") {
    return { success: false, reason: "trial_not_active" };
  }

  const copy = TRIAL_INTERVENTION_COPY[args.trigger];
  const templateKey = getTrialTemplateKey(args.trigger);
  const interventionsSent = onboarding.interventionsSent ?? [];
  let sentCount = 0;
  const nextInterventions = [...interventionsSent];

  for (const admin of schoolAdmins) {
    await ctx.db.insert("notifications", {
      tenantId: args.tenantId,
      userId: admin.eduMylesUserId,
      title: copy.title,
      message: copy.message,
      type: "trial_intervention",
      isRead: false,
      link: "/admin/settings/billing",
      createdAt: now,
    });

    if (admin.email && !getInterventionAlreadySent(interventionsSent, args.trigger, `email:${admin.email}`)) {
      await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
        tenantId: args.tenantId,
        actorId: admin.eduMylesUserId,
        actorEmail: admin.email,
        to: [admin.email],
        subject: copy.emailSubject,
        text: `${copy.message}\n\nOpen EduMyles billing to choose the best plan for your school.`,
        template: templateKey,
        data: {
          schoolName: tenantRecord.name,
          billingUrl: `${getAppUrl()}/admin/settings/billing`,
          accountManagerName: undefined,
        },
      });
      nextInterventions.push({
        type: args.trigger,
        sentAt: now,
        channel: `email:${admin.email}`,
      });
      sentCount += 1;
    }

    if (
      copy.smsMessage &&
      admin.phone &&
      !getInterventionAlreadySent(interventionsSent, args.trigger, `sms:${admin.phone}`)
    ) {
      await ctx.scheduler.runAfter(0, internal.actions.communications.sms.sendSmsInternal, {
        tenantId: args.tenantId,
        actorId: admin.eduMylesUserId,
        actorEmail: admin.email,
        phone: admin.phone,
        message: copy.smsMessage,
      });
      nextInterventions.push({
        type: args.trigger,
        sentAt: now,
        channel: `sms:${admin.phone}`,
      });
      sentCount += 1;
    }
  }

  if (
    args.trigger === "day_12" &&
    onboarding.assignedAccountManager &&
    !getInterventionAlreadySent(interventionsSent, args.trigger, "account_manager")
  ) {
    await ctx.db.insert("notifications", {
      tenantId: "PLATFORM",
      userId: onboarding.assignedAccountManager,
      title: "Trial outreach needed",
      message: `${tenantRecord.name} is nearing trial expiry and may need help converting.`,
      type: "platform_alert",
      isRead: false,
      link: `/platform/tenants/${args.tenantId}`,
      createdAt: now,
    });
    nextInterventions.push({
      type: args.trigger,
      sentAt: now,
      channel: "account_manager",
    });
  }

  const existingIntervention = await ctx.db
    .query("trial_interventions")
    .withIndex("by_tenant_trigger", (q: any) =>
      q.eq("tenantId", args.tenantId).eq("trigger", args.trigger)
    )
    .first();

  if (!existingIntervention) {
    await ctx.db.insert("trial_interventions", {
      tenantId: args.tenantId,
      interventionType: copy.smsMessage ? "sms" : "email",
      trigger: args.trigger,
      sentAt: now,
      opened: false,
      clicked: false,
      createdAt: now,
    });
  }

  await ctx.db.patch(onboarding._id, {
    interventionsSent: nextInterventions,
    updatedAt: now,
  });

  return { success: true, sentCount };
}

async function scheduleTrialInterventionsHelper(
  ctx: any,
  args: { tenantId: string; trialStartedAt: number }
) {
  for (const entry of TRIAL_INTERVENTION_TRIGGERS) {
    const runAt = args.trialStartedAt + entry.day * DAY_MS;
    await ctx.scheduler.runAt(runAt, internal.modules.platform.onboarding.sendTrialIntervention, {
      tenantId: args.tenantId,
      trigger: entry.trigger,
    });
  }
}

async function processTrialExpiryHelper(ctx: any, tenantId: string) {
  const now = Date.now();
  const [tenantRecord, subscription, onboarding] = await Promise.all([
    getTenantRecord(ctx, tenantId),
    getTrialSubscription(ctx, tenantId),
    ensureOnboardingRecord(ctx, tenantId),
  ]);

  if (!tenantRecord || !subscription) {
    return { success: false, reason: "tenant_or_subscription_missing" };
  }

  if (tenantRecord.status !== "trial" && tenantRecord.status !== "trial_expired") {
    return { success: false, reason: "tenant_not_in_trial_state" };
  }

  const installs = await ctx.db
    .query("module_installs")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId))
    .collect();

  for (const install of installs) {
    if ((install.moduleSlug ?? "").startsWith("core_")) continue;
    if (!["active", "disabled", "suspended_payment"].includes(install.status)) continue;
    await ctx.db.patch(install._id, {
      status: "suspended_platform",
      updatedAt: now,
    });
  }

  await ctx.db.patch(subscription._id, {
    status: "past_due",
    graceEndsAt: now + 7 * DAY_MS,
    updatedAt: now,
  });

  await ctx.db.patch(tenantRecord._id, {
    status: "trial_expired",
    updatedAt: now,
  });

  await ctx.scheduler.runAfter(7 * DAY_MS, internal.modules.platform.onboarding.hardSuspendExpiredTrial, {
    tenantId,
  });

  await sendTrialInterventionHelper(ctx, { tenantId, trigger: "day_14" });

  if (!getInterventionAlreadySent(onboarding.interventionsSent ?? [], "day_14", "trial_expired_marker")) {
    await ctx.db.patch(onboarding._id, {
      interventionsSent: [
        ...(onboarding.interventionsSent ?? []),
        { type: "day_14", sentAt: now, channel: "trial_expired_marker" },
      ],
      updatedAt: now,
    });
  }

  return { success: true };
}

async function hardSuspendExpiredTrialHelper(ctx: any, tenantId: string) {
  const now = Date.now();
  const [tenantRecord, subscription] = await Promise.all([
    getTenantRecord(ctx, tenantId),
    getTrialSubscription(ctx, tenantId),
  ]);

  if (!tenantRecord || !subscription) {
    return { success: false, reason: "tenant_or_subscription_missing" };
  }

  if (tenantRecord.status !== "trial_expired") {
    return { success: false, reason: "tenant_converted_or_not_expired" };
  }

  await ctx.db.patch(tenantRecord._id, {
    status: "suspended",
    suspendedAt: now,
    suspendReason: "trial_expired",
    updatedAt: now,
  });

  await ctx.db.patch(subscription._id, {
    status: "suspended",
    updatedAt: now,
  });

  return { success: true };
}

async function activateTenantIfEligible(ctx: any, args: { tenantId: string; userId: string }) {
  const onboarding = await ctx.db
    .query("tenant_onboarding")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", args.tenantId))
    .first();

  if (!onboarding || onboarding.isActivated || onboarding.healthScore < 50) {
    return { activated: false };
  }

  const now = Date.now();
  const trialEndsAt = now + 14 * DAY_MS;

  await ctx.db.patch(onboarding._id, {
    isActivated: true,
    updatedAt: now,
  });

  const tenant = await ctx.db
    .query("tenants")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", args.tenantId))
    .first();

  if (tenant) {
    await ctx.db.patch(tenant._id, {
      status: "trial",
      trialStartedAt: now,
      trialEndsAt,
      activatedAt: tenant.activatedAt ?? now,
      updatedAt: now,
    });
  }

  const subscription = await ctx.db
    .query("tenant_subscriptions")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", args.tenantId))
    .first();

  if (subscription) {
    await ctx.db.patch(subscription._id, {
      status: "trialing",
      currentPeriodStart: now,
      currentPeriodEnd: trialEndsAt,
      nextPaymentDue: trialEndsAt,
      trialEndsAt,
      updatedAt: now,
    });
  }

  await createOnboardingNotification(
    ctx,
    args.tenantId,
    args.userId,
    "Trial activated",
    "Your EduMyles trial is now active for 14 days.",
    "/admin"
  );

  await scheduleTrialInterventionsHelper(ctx, {
    tenantId: args.tenantId,
    trialStartedAt: now,
  });

  const schoolAdmin = await ctx.db
    .query("users")
    .withIndex("by_tenant_role", (q: any) => q.eq("tenantId", args.tenantId).eq("role", "school_admin"))
    .first();

  if (tenant && schoolAdmin?.email) {
    await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
      tenantId: args.tenantId,
      actorId: schoolAdmin.eduMylesUserId,
      actorEmail: schoolAdmin.email,
      to: [schoolAdmin.email],
      subject: "Your EduMyles trial is now active",
      template: "activation_congratulations",
      data: {
        firstName: schoolAdmin.firstName ?? "there",
        schoolName: tenant.name,
        trialEndsAt: new Date(trialEndsAt).toUTCString(),
        dashboardUrl: `${getAppUrl()}/admin`,
      },
    });
  }

  return { activated: true, trialEndsAt };
}

export const getTenantOnboarding = query({
  args: {
    sessionToken: v.optional(v.string()),
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.sessionToken) {
      return null;
    }

    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    const onboarding = await ctx.db
      .query("tenant_onboarding")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .first();

    const steps = normalizeLegacySteps(onboarding?.steps);
    const stepPayloads = normalizeStepPayloads(onboarding?.stepPayloads);
    const healthScore = onboarding?.healthScore ?? calculateHealthScore(steps);
    const currentStep = onboarding?.currentStep ?? getCurrentStep(steps);

    return {
      ...onboarding,
      tenantId: tenant.tenantId,
      wizardCompleted: onboarding?.wizardCompleted ?? false,
      wizardCompletedAt: onboarding?.wizardCompletedAt,
      isActivated: onboarding?.isActivated ?? false,
      currentStep,
      healthScore,
      steps,
      stepPayloads,
    };
  },
});

export const getSetupWizardContext = query({
  args: {
    sessionToken: v.optional(v.string()),
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.sessionToken) {
      return null;
    }

    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    const tenantRecord = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenant.tenantId))
      .first();

    const onboarding = await ctx.db
      .query("tenant_onboarding")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .first();
    const stepPayloads = normalizeStepPayloads(onboarding?.stepPayloads);
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect();
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect();
    const feeStructures = await ctx.db
      .query("feeStructures")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect();
    const pendingStaffInvites = await ctx.db
      .query("staff_invites")
      .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect();
    const whiteLabelConfig = await ctx.db
      .query("whiteLabelConfigs")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .first();

    const tenantProfile = (tenantRecord ?? {}) as any;

    return {
      tenantId: tenant.tenantId,
      tenantName: tenantRecord?.name ?? "Your School",
      tenantSlug: tenantRecord?.subdomain ?? tenant.tenantId.toLowerCase(),
      tenantStatus: tenantRecord?.status ?? "pending_setup",
      profile: {
        schoolType: tenantProfile.schoolType,
        levels: tenantProfile.levels ?? [],
        boardingType: tenantProfile.boardingType,
        officialEmail: tenantProfile.email ?? tenant.email,
        phone: tenantProfile.phone ?? "",
        website: tenantProfile.website,
        county: tenantProfile.county ?? "",
        registrationNumber: tenantProfile.registrationNumber,
        logoUrl: tenantProfile.logoUrl,
      },
      stepPayloads,
      setupData: {
        academicYear: stepPayloads.academicYear ?? null,
        gradingSystem: stepPayloads.gradingSystem ?? null,
        subjects: subjects.length > 0 ? subjects : (stepPayloads.subjects ?? []),
        classes: classes.length > 0 ? classes : (stepPayloads.classes ?? []),
        feeStructure: feeStructures[0] ?? stepPayloads.feeStructure ?? null,
        staffInvites: pendingStaffInvites.filter((invite: any) => invite.status === "pending"),
        studentsAdded: stepPayloads.studentsAdded ?? [],
        branding: whiteLabelConfig
          ? {
              brandName: whiteLabelConfig.brandName,
              logoUrl: whiteLabelConfig.logoUrl,
              primaryColor: whiteLabelConfig.primaryColor,
              secondaryColor: whiteLabelConfig.secondaryColor,
              accentColor: whiteLabelConfig.accentColor,
              footerText: whiteLabelConfig.footerText,
            }
          : (stepPayloads.portalCustomized ?? null),
      },
      onboarding: {
        currentStep: onboarding?.currentStep ?? 1,
        healthScore: onboarding?.healthScore ?? 0,
        isActivated: onboarding?.isActivated ?? false,
      },
    };
  },
});

export const saveSchoolProfileStep = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    schoolType: v.optional(v.string()),
    levels: v.optional(v.array(v.string())),
    boardingType: v.optional(v.string()),
    officialEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    county: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    const tenantRecord = await ensureTenantRecord(ctx, tenant);

    const tenantProfile = tenantRecord as any;
    const onboarding = await ensureOnboardingRecord(ctx, tenant.tenantId);
    const stepPayloads = normalizeStepPayloads(onboarding?.stepPayloads);
    stepPayloads.schoolProfile = {
      schoolType: args.schoolType ?? tenantRecord.schoolType,
      levels: args.levels ?? tenantRecord.levels,
      boardingType: args.boardingType ?? tenantRecord.boardingType,
      officialEmail: args.officialEmail ?? tenantRecord.email,
      phone: args.phone ?? tenantRecord.phone,
      website: args.website ?? tenantProfile.website,
      county: args.county ?? tenantRecord.county,
      registrationNumber: args.registrationNumber ?? tenantProfile.registrationNumber,
      logoUrl: args.logoUrl ?? tenantProfile.logoUrl,
    };

    await ctx.db.patch(tenantRecord._id, {
      schoolType: args.schoolType ?? tenantRecord.schoolType,
      levels: args.levels ?? tenantRecord.levels,
      boardingType: args.boardingType ?? tenantRecord.boardingType,
      email: args.officialEmail ?? tenantRecord.email,
      phone: args.phone ?? tenantRecord.phone,
      website: args.website ?? tenantProfile.website,
      county: args.county ?? tenantRecord.county,
      registrationNumber: args.registrationNumber ?? tenantProfile.registrationNumber,
      logoUrl: args.logoUrl ?? tenantProfile.logoUrl,
      updatedAt: Date.now(),
    } as any);

    await ctx.db.patch(onboarding._id, {
      stepPayloads,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "tenant.updated",
      entityType: "tenant_profile",
      entityId: tenant.tenantId,
      after: {
        schoolType: args.schoolType,
        levels: args.levels,
        boardingType: args.boardingType,
      },
    });

    return { success: true };
  },
});

export const saveAcademicYearStep = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    yearName: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    structure: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    const onboarding = await ensureOnboardingRecord(ctx, tenant.tenantId);
    const stepPayloads = normalizeStepPayloads(onboarding?.stepPayloads);

    stepPayloads.academicYear = {
      yearName: args.yearName,
      startDate: args.startDate,
      endDate: args.endDate,
      structure: args.structure,
    };

    await ctx.db.patch(onboarding._id, {
      stepPayloads,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "onboarding.step_completed",
      entityType: "tenant_onboarding",
      entityId: String(onboarding._id),
      after: stepPayloads.academicYear,
    });

    return { success: true };
  },
});

export const saveGradingSystemStep = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    preset: v.string(),
    passMark: v.number(),
    scaleLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    const onboarding = await ensureOnboardingRecord(ctx, tenant.tenantId);
    const stepPayloads = normalizeStepPayloads(onboarding?.stepPayloads);

    stepPayloads.gradingSystem = {
      preset: args.preset,
      passMark: args.passMark,
      scaleLabel: args.scaleLabel,
    };

    await ctx.db.patch(onboarding._id, {
      stepPayloads,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "onboarding.step_completed",
      entityType: "tenant_onboarding",
      entityId: String(onboarding._id),
      after: stepPayloads.gradingSystem,
    });

    return { success: true };
  },
});

export const saveSubjectsStep = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    subjects: v.array(
      v.object({
        name: v.string(),
        code: v.string(),
        department: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    const onboarding = await ensureOnboardingRecord(ctx, tenant.tenantId);
    const stepPayloads = normalizeStepPayloads(onboarding?.stepPayloads);
    const existingSubjects = await ctx.db
      .query("subjects")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect();

    for (const subject of args.subjects) {
      const normalizedCode = subject.code.trim().toUpperCase();
      const existing = existingSubjects.find((item: any) => item.code === normalizedCode);
      if (existing) {
        await ctx.db.patch(existing._id, {
          name: subject.name.trim(),
          code: normalizedCode,
          department: subject.department?.trim(),
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("subjects", {
          tenantId: tenant.tenantId,
          name: subject.name.trim(),
          code: normalizedCode,
          department: subject.department?.trim(),
          description: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    stepPayloads.subjects = args.subjects.map((subject) => ({
      name: subject.name.trim(),
      code: subject.code.trim().toUpperCase(),
      department: subject.department?.trim(),
    }));

    await ctx.db.patch(onboarding._id, {
      stepPayloads,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, count: args.subjects.length };
  },
});

export const saveClassesStep = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    classes: v.array(
      v.object({
        name: v.string(),
        level: v.optional(v.string()),
        stream: v.optional(v.string()),
        capacity: v.optional(v.number()),
        academicYear: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    const onboarding = await ensureOnboardingRecord(ctx, tenant.tenantId);
    const stepPayloads = normalizeStepPayloads(onboarding?.stepPayloads);
    const existingClasses = await ctx.db
      .query("classes")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect();

    for (const classItem of args.classes) {
      const existing = existingClasses.find((entry: any) => entry.name === classItem.name.trim());
      if (existing) {
        await ctx.db.patch(existing._id, {
          name: classItem.name.trim(),
          level: classItem.level?.trim(),
          stream: classItem.stream?.trim(),
          capacity: classItem.capacity,
          academicYear: classItem.academicYear?.trim(),
        });
      } else {
        await ctx.db.insert("classes", {
          tenantId: tenant.tenantId,
          name: classItem.name.trim(),
          level: classItem.level?.trim(),
          stream: classItem.stream?.trim(),
          teacherId: undefined,
          capacity: classItem.capacity,
          academicYear: classItem.academicYear?.trim(),
          createdAt: Date.now(),
        });
      }
    }

    stepPayloads.classes = args.classes.map((classItem) => ({
      name: classItem.name.trim(),
      level: classItem.level?.trim(),
      stream: classItem.stream?.trim(),
      capacity: classItem.capacity,
      academicYear: classItem.academicYear?.trim(),
    }));

    await ctx.db.patch(onboarding._id, {
      stepPayloads,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, count: args.classes.length };
  },
});

export const saveFeeStructureStep = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    name: v.string(),
    amount: v.number(),
    academicYear: v.string(),
    grade: v.string(),
    frequency: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    const onboarding = await ensureOnboardingRecord(ctx, tenant.tenantId);
    const stepPayloads = normalizeStepPayloads(onboarding?.stepPayloads);
    const existingFeeStructure = await ctx.db
      .query("feeStructures")
      .withIndex("by_tenant_academic_year", (q: any) => q.eq("tenantId", tenant.tenantId).eq("academicYear", args.academicYear))
      .collect();
    const matching = existingFeeStructure.find(
      (entry: any) => entry.name === args.name && entry.grade === args.grade
    );

    if (matching) {
      await ctx.db.patch(matching._id, {
        amount: args.amount,
        frequency: args.frequency,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("feeStructures", {
        tenantId: tenant.tenantId,
        name: args.name,
        amount: args.amount,
        academicYear: args.academicYear,
        grade: args.grade,
        frequency: args.frequency,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    stepPayloads.feeStructure = {
      name: args.name,
      amount: args.amount,
      academicYear: args.academicYear,
      grade: args.grade,
      frequency: args.frequency,
    };

    await ctx.db.patch(onboarding._id, {
      stepPayloads,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const saveStudentsStep = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    students: v.array(
      v.object({
        admissionNumber: v.optional(v.string()),
        firstName: v.string(),
        lastName: v.string(),
        dateOfBirth: v.string(),
        gender: v.string(),
        className: v.optional(v.string()),
        guardianName: v.optional(v.string()),
        guardianEmail: v.optional(v.string()),
        guardianPhone: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    const onboarding = await ensureOnboardingRecord(ctx, tenant.tenantId);
    const stepPayloads = normalizeStepPayloads(onboarding?.stepPayloads);
    const existingClasses = await ctx.db
      .query("classes")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .collect();

    let createdCount = 0;
    for (const student of args.students) {
      const admissionNumber =
        student.admissionNumber?.trim() ||
        `ADM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const classRecord = student.className
        ? existingClasses.find((item: any) => item.name === student.className)
        : null;
      const studentId = await ctx.db.insert("students", {
        tenantId: tenant.tenantId,
        admissionNumber,
        firstName: student.firstName.trim(),
        lastName: student.lastName.trim(),
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        classId: classRecord?._id,
        status: "active",
        guardianUserId: undefined,
        photoUrl: undefined,
        enrolledAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      if (student.guardianName || student.guardianEmail || student.guardianPhone) {
        await ctx.db.insert("guardians", {
          tenantId: tenant.tenantId,
          firstName: student.guardianName?.split(" ")[0] || "Parent",
          lastName: student.guardianName?.split(" ").slice(1).join(" ") || "",
          email: student.guardianEmail || "",
          phone: student.guardianPhone || "",
          relationship: "parent",
          studentIds: [String(studentId)],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      createdCount += 1;
    }

    stepPayloads.studentsAdded = args.students.map((student) => ({
      admissionNumber: student.admissionNumber?.trim(),
      firstName: student.firstName.trim(),
      lastName: student.lastName.trim(),
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      className: student.className?.trim(),
      guardianName: student.guardianName?.trim(),
      guardianEmail: student.guardianEmail?.trim(),
      guardianPhone: student.guardianPhone?.trim(),
    }));

    await ctx.db.patch(onboarding._id, {
      stepPayloads,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, count: createdCount };
  },
});

export const savePortalCustomizationStep = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    brandName: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    footerText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    const onboarding = await ensureOnboardingRecord(ctx, tenant.tenantId);
    const stepPayloads = normalizeStepPayloads(onboarding?.stepPayloads);
    const existingConfig = await ctx.db
      .query("whiteLabelConfigs")
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
      .first();
    const now = Date.now();

    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, {
        brandName: args.brandName ?? existingConfig.brandName,
        logoUrl: args.logoUrl ?? existingConfig.logoUrl,
        primaryColor: args.primaryColor ?? existingConfig.primaryColor,
        secondaryColor: args.secondaryColor ?? existingConfig.secondaryColor,
        accentColor: args.accentColor ?? existingConfig.accentColor,
        footerText: args.footerText ?? existingConfig.footerText,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("whiteLabelConfigs", {
        tenantId: tenant.tenantId,
        brandName: args.brandName || "EduMyles",
        logoUrl: args.logoUrl,
        primaryColor: args.primaryColor || "#0F3D2E",
        secondaryColor: args.secondaryColor || "#D1A23C",
        accentColor: args.accentColor || "#1F7A52",
        favicon: undefined,
        customDomain: undefined,
        emailFromName: undefined,
        emailFromAddress: undefined,
        footerText: args.footerText,
        customCSS: undefined,
        isActive: true,
        createdBy: tenant.userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    const tenantRecord = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenant.tenantId))
      .first();
    if (tenantRecord) {
      await ctx.db.patch(tenantRecord._id, {
        logoUrl: args.logoUrl ?? (tenantRecord as any).logoUrl,
        updatedAt: now,
      } as any);
    }

    stepPayloads.portalCustomized = {
      brandName: args.brandName,
      logoUrl: args.logoUrl,
      primaryColor: args.primaryColor,
      secondaryColor: args.secondaryColor,
      accentColor: args.accentColor,
      footerText: args.footerText,
    };

    await ctx.db.patch(onboarding._id, {
      stepPayloads,
      lastActivityAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const sendParentInvitesStep = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    sendSms: v.optional(v.boolean()),
    sendEmail: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    const onboarding = await ensureOnboardingRecord(ctx, tenant.tenantId);
    const now = Date.now();
    const doSms = args.sendSms ?? true;
    const doEmail = args.sendEmail ?? true;

    const tenantRecord = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .first();

    const guardians = await ctx.db
      .query("guardians")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();

    const tenantUsers = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();

    let smsSent = 0;
    let emailsSent = 0;
    let createdInvites = 0;
    const missing: string[] = [];

    for (const guardian of guardians) {
      const email = guardian.email?.trim().toLowerCase() || undefined;
      const phone = guardian.phone?.trim() || undefined;

      if (!email && !phone) {
        missing.push(`${guardian.firstName} ${guardian.lastName}`.trim());
        continue;
      }

      let linkedUser = guardian.userId
        ? tenantUsers.find((user) => user.eduMylesUserId === guardian.userId)
        : undefined;

      if (!linkedUser && email) {
        linkedUser = tenantUsers.find((user) => user.email.toLowerCase() === email);
      }

      if (!linkedUser) {
        const pendingUserId = `USR-${crypto.randomUUID()}`;
        await ctx.db.insert("users", {
          tenantId: tenant.tenantId,
          eduMylesUserId: pendingUserId,
          workosUserId: `pending-parent-${crypto.randomUUID()}`,
          inviteToken: undefined,
          email: email ?? `pending-parent-${crypto.randomUUID()}@pending.edumyles.local`,
          firstName: guardian.firstName || "Parent",
          lastName: guardian.lastName || "",
          role: "parent",
          permissions: [],
          organizationId: undefined,
          isActive: false,
          status: "pending_activation",
          avatarUrl: undefined,
          phone,
          bio: undefined,
          location: undefined,
          passwordHash: undefined,
          twoFactorEnabled: undefined,
          twoFactorSecret: undefined,
          tempTwoFactorSecret: undefined,
          recoveryCodes: undefined,
          lastPasswordChangeAt: undefined,
          createdAt: now,
        });

        await ctx.db.patch(guardian._id, {
          userId: pendingUserId,
          updatedAt: now,
        });

        linkedUser = { eduMylesUserId: pendingUserId, email: email ?? "" } as any;
      }

      const existingPendingInvite = (
        await ctx.db
          .query("parent_invites")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
          .collect()
      ).find((invite: any) => {
        if (invite.status !== "pending") return false;
        if (email && invite.email?.toLowerCase() === email) return true;
        if (phone && invite.phone === phone) return true;
        return false;
      });

      const token = existingPendingInvite?.token ?? createInviteToken();
      if (!existingPendingInvite) {
        await ctx.db.insert("parent_invites", {
          tenantId: tenant.tenantId,
          studentId: guardian.studentIds[0],
          email,
          phone,
          token,
          status: "pending",
          invitedBy: tenant.userId,
          expiresAt: now + 7 * DAY_MS,
          acceptedAt: undefined,
          workosUserId: undefined,
          createdAt: now,
          updatedAt: now,
        });
        createdInvites += 1;
      }

      const joinUrl = `${getAppUrl()}/join/${tenantRecord?.subdomain ?? tenant.tenantId}?token=${token}`;
      const message = `${tenantRecord?.name ?? "Your school"} invited you to activate your parent access on EduMyles. Open ${joinUrl}`;

      if (doEmail && email) {
        await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
          tenantId: tenant.tenantId,
          actorId: tenant.userId,
          actorEmail: tenant.email,
          to: [email],
          subject: `Join ${tenantRecord?.name ?? "your school"} on EduMyles`,
          text: `${message}\n\nThis invitation expires in 7 days.`,
          template: "parent_invite_email",
          data: {
            schoolName: tenantRecord?.name ?? "your school",
            studentName: "your child",
            joinUrl,
            parentName: [guardian.firstName, guardian.lastName].filter(Boolean).join(" ") || undefined,
          },
        });
        emailsSent += 1;
      }

      if (doSms && phone) {
        await ctx.scheduler.runAfter(0, internal.actions.communications.sms.sendSmsInternal, {
          tenantId: tenant.tenantId,
          actorId: tenant.userId,
          actorEmail: tenant.email,
          phone,
          message,
        });
        smsSent += 1;
      }
    }

    await ctx.db.patch(onboarding._id, {
      lastActivityAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "user.invited",
      entityType: "parent_invites",
      entityId: tenant.tenantId,
      after: { createdInvites, emailsSent, smsSent, missingCount: missing.length },
    });

    return { success: true, createdInvites, emailsSent, smsSent, missing };
  },
});

export const completeFirstActionForTenant = internalMutation({
  args: {
    tenantId: v.string(),
    userId: v.optional(v.string()),
    source: v.union(v.literal("attendance"), v.literal("invoice"), v.literal("assignment")),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await markFirstActionCompleted(ctx, args);
  },
});

export const updateOnboardingStep = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    step: v.union(
      v.literal("schoolProfile"),
      v.literal("academicYear"),
      v.literal("gradingSystem"),
      v.literal("subjects"),
      v.literal("classes"),
      v.literal("feeStructure"),
      v.literal("staffAdded"),
      v.literal("studentsAdded"),
      v.literal("modulesConfigured"),
      v.literal("portalCustomized"),
      v.literal("parentsInvited"),
      v.literal("firstAction")
    ),
    completed: v.boolean(),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    const now = Date.now();
    const existing = await ctx.db
      .query("tenant_onboarding")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .first();

    const steps = normalizeLegacySteps(existing?.steps);
    const existingStep = steps[args.step];
    const stepPoints = args.completed ? STEP_POINTS[args.step] : 0;

    steps[args.step] = {
      completed: args.completed,
      completedAt: args.completed ? now : undefined,
      count: args.count ?? existingStep.count,
      pointsAwarded: stepPoints,
    };

    const wizardCompleted = onboardingStepNames.every((stepName) => steps[stepName].completed);
    const healthScore = calculateHealthScore(steps);
    const currentStep = getCurrentStep(steps);

    if (existing) {
      await ctx.db.patch(existing._id, {
        steps,
        wizardCompleted,
        wizardCompletedAt: wizardCompleted ? now : undefined,
        currentStep,
        healthScore,
        lastActivityAt: now,
        stalled: false,
        isStalled: false,
        stalledSince: undefined,
        stalledAtStep: undefined,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("tenant_onboarding", {
        tenantId: tenant.tenantId,
        wizardCompleted,
        wizardCompletedAt: wizardCompleted ? now : undefined,
        currentStep,
        isActivated: false,
        steps,
        healthScore,
        lastActivityAt: now,
        stalled: false,
        isStalled: false,
        stalledSince: undefined,
        stalledAtStep: undefined,
        assignedAccountManager: undefined,
        interventionsSent: [],
        createdAt: now,
        updatedAt: now,
      });
    }

    if (args.completed) {
      await createOnboardingNotification(
        ctx,
        tenant.tenantId,
        tenant.userId,
        "Onboarding step completed",
        `You completed the ${STEP_TITLES[args.step]} step.`
      );
    }

    const activation = await activateTenantIfEligible(ctx, {
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });

    if (wizardCompleted) {
      await createOnboardingNotification(
        ctx,
        tenant.tenantId,
        tenant.userId,
        "Onboarding complete",
        "Your onboarding checklist is complete. You can now move fully into day-to-day operations.",
        "/admin"
      );
    }

    return {
      success: true,
      healthScore,
      wizardCompleted,
      currentStep,
      activated: activation.activated,
    };
  },
});

export const skipOnboardingStep = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.optional(v.string()),
    step: v.union(v.literal("feeStructure"), v.literal("staffAdded"), v.literal("parentsInvited")),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken, tenantId: args.tenantId });
    const now = Date.now();
    const existing = await ctx.db
      .query("tenant_onboarding")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .first();

    const steps = normalizeLegacySteps(existing?.steps);
    steps[args.step] = {
      ...steps[args.step],
      completed: true,
      completedAt: now,
      pointsAwarded: 0,
    };

    const wizardCompleted = onboardingStepNames.every((stepName) => steps[stepName].completed);
    const healthScore = calculateHealthScore(steps);
    const currentStep = getCurrentStep(steps);

    if (existing) {
      await ctx.db.patch(existing._id, {
        steps,
        wizardCompleted,
        wizardCompletedAt: wizardCompleted ? now : undefined,
        currentStep,
        healthScore,
        lastActivityAt: now,
        updatedAt: now,
      });
    }

    await createOnboardingNotification(
      ctx,
      tenant.tenantId,
      tenant.userId,
      "Onboarding step skipped",
      `You skipped the ${STEP_TITLES[args.step]} step for now.`
    );

    const activation = await activateTenantIfEligible(ctx, {
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });

    return {
      success: true,
      healthScore,
      currentStep,
      wizardCompleted,
      activated: activation.activated,
    };
  },
});

export const completeWizardStep = updateOnboardingStep;

export const computeHealthScore = internalMutation({
  args: {
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    const onboarding = await ctx.db
      .query("tenant_onboarding")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!onboarding) {
      return { success: false, healthScore: 0 };
    }

    const steps = normalizeLegacySteps(onboarding.steps);
    const healthScore = calculateHealthScore(steps);

    await ctx.db.patch(onboarding._id, {
      steps,
      healthScore,
      currentStep: getCurrentStep(steps),
      stalled: onboarding.lastActivityAt < Date.now() - 2 * DAY_MS,
      isStalled: onboarding.lastActivityAt < Date.now() - 2 * DAY_MS,
      updatedAt: Date.now(),
    });

    return { success: true, healthScore };
  },
});

export const getStalledOnboardings = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const records = await ctx.db
      .query("tenant_onboarding")
      .withIndex("by_stalled", (q) => q.eq("stalled", true))
      .collect();

    return Promise.all(
      records.map(async (record) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", record.tenantId))
          .first();
        return {
          ...record,
          steps: normalizeLegacySteps(record.steps),
          tenantName: tenant?.name ?? record.tenantId,
        };
      })
    );
  },
});

export const getTrialDashboard = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const subscriptions = await ctx.db
      .query("tenant_subscriptions")
      .withIndex("by_status", (q) => q.eq("status", "trialing"))
      .collect();

    const onboardingRecords = await ctx.db.query("tenant_onboarding").collect();
    const onboardingByTenant = new Map(
      onboardingRecords.map((record) => [record.tenantId, record])
    );

    return Promise.all(
      subscriptions.map(async (subscription) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", subscription.tenantId))
          .first();
        const onboarding = onboardingByTenant.get(subscription.tenantId);

        return {
          tenantId: subscription.tenantId,
          tenantName: tenant?.name ?? subscription.tenantId,
          trialEndsAt: subscription.trialEndsAt,
          currentPeriodEnd: subscription.currentPeriodEnd,
          healthScore: onboarding?.healthScore ?? 0,
          stalled: onboarding?.stalled ?? false,
          wizardCompleted: onboarding?.wizardCompleted ?? false,
        };
      })
    );
  },
});

export const getTenantSuccessDashboard = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const [records, tenants, subscriptions, users] = await Promise.all([
      ctx.db.query("tenant_onboarding").collect(),
      ctx.db.query("tenants").collect(),
      ctx.db.query("tenant_subscriptions").collect(),
      ctx.db.query("users").collect(),
    ]);

    const tenantById = new Map(tenants.map((tenant) => [tenant.tenantId, tenant]));
    const subscriptionByTenantId = new Map(subscriptions.map((subscription) => [subscription.tenantId, subscription]));
    const userById = new Map(users.map((user) => [user.eduMylesUserId, user]));
    const now = Date.now();
    const oneWeekAgo = now - 7 * DAY_MS;

    const rows = records
      .map((record) => {
        const tenant = tenantById.get(record.tenantId);
        const subscription = subscriptionByTenantId.get(record.tenantId);
        const normalizedSteps = normalizeLegacySteps(record.steps);
        const completedCount = onboardingStepNames.filter((stepName) => normalizedSteps[stepName]?.completed).length;
        const assignedManager = record.assignedAccountManager
          ? userById.get(record.assignedAccountManager)
          : null;
        const converted =
          subscription?.status === "active" &&
          tenant?.status === "active" &&
          (subscription.updatedAt ?? tenant?.updatedAt ?? 0) >= oneWeekAgo;
        const activated = record.healthScore >= 50 || Boolean(record.isActivated) || tenant?.status === "trial";
        const status =
          converted ? "converted" : record.stalled ? "stalled" : activated ? "activated" : record.healthScore < 20 ? "at_risk" : "in_progress";

        return {
          tenantId: record.tenantId,
          tenantName: tenant?.name ?? record.tenantId,
          country: tenant?.country ?? "Unknown",
          county: tenant?.county ?? null,
          healthScore: record.healthScore,
          stalled: record.stalled,
          wizardCompleted: record.wizardCompleted,
          currentStep: record.currentStep ?? getCurrentStep(normalizedSteps),
          currentStepLabel: getCurrentStepLabel(record.currentStep ?? getCurrentStep(normalizedSteps)),
          completedCount,
          totalSteps: onboardingStepNames.length,
          progressPct: Math.round((completedCount / onboardingStepNames.length) * 100),
          lastActivityAt: record.lastActivityAt,
          status,
          tenantStatus: tenant?.status ?? "unknown",
          planId: subscription?.planId ?? null,
          trialEndsAt: subscription?.trialEndsAt ?? tenant?.trialEndsAt ?? null,
          currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
          assignedAccountManager: record.assignedAccountManager ?? null,
          assignedAccountManagerName: assignedManager
            ? [assignedManager.firstName, assignedManager.lastName].filter(Boolean).join(" ") || assignedManager.email
            : null,
          assignedAccountManagerInitials: assignedManager
            ? getInitials(assignedManager.firstName, assignedManager.lastName, assignedManager.email)
            : null,
          notes: record.platformNotes ?? [],
          interventionsSent: record.interventionsSent ?? [],
        };
      })
      .sort((a, b) => b.lastActivityAt - a.lastActivityAt);

    const activeTrials = rows.filter((row) => row.tenantStatus === "trial" || (row.planId && row.status !== "converted" && row.trialEndsAt));
    const activatedCount = rows.filter((row) => row.healthScore >= 50).length;
    const convertingThisWeek = rows.filter((row) => row.status === "converted").length;

    return {
      stats: {
        activeTrialsCount: activeTrials.length,
        activatedPercentage: rows.length > 0 ? Math.round((activatedCount / rows.length) * 100) : 0,
        stalledCount: rows.filter((row) => row.stalled).length,
        averageHealthScore: rows.length > 0 ? Math.round(rows.reduce((sum, row) => sum + row.healthScore, 0) / rows.length) : 0,
        convertingThisWeek,
      },
      rows,
      stalledQueue: rows.filter((row) => row.stalled),
      nudgeTemplates: [
        { key: "stalled_step_auto", label: "Auto-match current stalled step", description: "Uses the tenant's current step to choose the right reminder.", message: NUDGE_TEMPLATE_MAP.stalled_onboarding.message },
        ...Object.entries(NUDGE_TEMPLATE_MAP).map(([key, value]) => ({
          key,
          label: value.label,
          description: value.description,
          message: value.message,
        })),
      ],
    };
  },
});

export const getPlatformOnboardingRecords = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const records = await ctx.db.query("tenant_onboarding").collect();

    return Promise.all(
      records.map(async (record) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", record.tenantId))
          .first();
        const subscription = await ctx.db
          .query("tenant_subscriptions")
          .withIndex("by_tenantId", (q) => q.eq("tenantId", record.tenantId))
          .first();

        const normalizedSteps = normalizeLegacySteps(record.steps);
        const completedCount = onboardingStepNames.filter((stepName) => normalizedSteps[stepName]?.completed).length;

        return {
          ...record,
          steps: normalizedSteps,
          tenantName: tenant?.name ?? record.tenantId,
          tenantStatus: tenant?.status ?? "unknown",
          planId: subscription?.planId,
          trialEndsAt: subscription?.trialEndsAt,
          status: record.wizardCompleted ? "completed" : record.stalled ? "stalled" : "in_progress",
          completedCount,
          totalSteps: onboardingStepNames.length,
          progressPct: Math.round((completedCount / onboardingStepNames.length) * 100),
        };
      })
    );
  },
});

export const checkStalledOnboardings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now - 3 * DAY_MS;
    const records = await ctx.db.query("tenant_onboarding").collect();
    let stalledCount = 0;

    for (const record of records) {
      if (record.stalled || record.lastActivityAt > cutoff || record.wizardCompleted) {
        continue;
      }

      await ctx.db.patch(record._id, {
        stalled: true,
        updatedAt: now,
      });
      stalledCount += 1;

      if (record.assignedAccountManager) {
        await ctx.db.insert("notifications", {
          tenantId: "PLATFORM",
          userId: record.assignedAccountManager,
          title: "Stalled onboarding detected",
          message: `Tenant ${record.tenantId} has stalled onboarding progress and needs intervention.`,
          type: "platform_alert",
          isRead: false,
          link: `/platform/onboarding?tenantId=${record.tenantId}`,
          createdAt: now,
        });
      }
    }

    return { stalledCount };
  },
});

export const sendTrialInterventions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const subscriptions = await ctx.db
      .query("tenant_subscriptions")
      .withIndex("by_status", (q) => q.eq("status", "trialing"))
      .collect();

    let sent = 0;
    for (const subscription of subscriptions) {
      const elapsedDays = Math.max(
        1,
        Math.floor((now - subscription.currentPeriodStart) / DAY_MS) + 1
      );
      const matchingTrigger = TRIAL_INTERVENTION_TRIGGERS.find(
        (entry) => entry.day === elapsedDays
      );

      if (!matchingTrigger) continue;

      const existing = await ctx.db
        .query("trial_interventions")
        .withIndex("by_tenant_trigger", (q) =>
          q.eq("tenantId", subscription.tenantId).eq("trigger", matchingTrigger.trigger)
        )
        .first();

      if (existing) continue;

      await ctx.db.insert("trial_interventions", {
        tenantId: subscription.tenantId,
        interventionType: "in_app",
        trigger: matchingTrigger.trigger,
        sentAt: now,
        opened: false,
        clicked: false,
        createdAt: now,
      });

      const schoolAdmins = await ctx.db
        .query("users")
        .withIndex("by_tenant_role", (q) =>
          q.eq("tenantId", subscription.tenantId).eq("role", "school_admin")
        )
        .collect();

      for (const admin of schoolAdmins) {
        await ctx.db.insert("notifications", {
          tenantId: subscription.tenantId,
          userId: admin.eduMylesUserId,
          title: "Trial success tip",
          message: `Your EduMyles trial is on ${matchingTrigger.day === 14 ? "its final day" : `day ${matchingTrigger.day}`}. Complete onboarding tasks to maximize setup success.`,
          type: "trial_intervention",
          isRead: false,
          link: "/admin",
          createdAt: now,
        });
      }

      sent += 1;
    }

    return { sent };
  },
});

export const getPlatformOnboardingRecord = query({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    const record = await ctx.db
      .query("tenant_onboarding")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!record) {
      return null;
    }

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();
    const subscription = await ctx.db
      .query("tenant_subscriptions")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();
    const assignedManager = record.assignedAccountManager
      ? await ctx.db
          .query("users")
          .withIndex("by_user_id", (q) => q.eq("eduMylesUserId", record.assignedAccountManager!))
          .first()
      : null;

    const normalizedSteps = normalizeLegacySteps(record.steps);
    const completedCount = onboardingStepNames.filter((stepName) => normalizedSteps[stepName]?.completed).length;

    return {
      ...record,
      steps: normalizedSteps,
      tenantName: tenant?.name ?? record.tenantId,
      tenantStatus: tenant?.status ?? "unknown",
      planId: subscription?.planId,
      trialEndsAt: subscription?.trialEndsAt,
      status: record.wizardCompleted ? "completed" : record.stalled ? "stalled" : "in_progress",
      completedCount,
      totalSteps: onboardingStepNames.length,
      progressPct: Math.round((completedCount / onboardingStepNames.length) * 100),
      currentStepLabel: getCurrentStepLabel(record.currentStep ?? getCurrentStep(normalizedSteps)),
      assignedAccountManagerName: assignedManager
        ? [assignedManager.firstName, assignedManager.lastName].filter(Boolean).join(" ") || assignedManager.email
        : null,
      assignedAccountManagerInitials: assignedManager
        ? getInitials(assignedManager.firstName, assignedManager.lastName, assignedManager.email)
        : null,
      notes: record.platformNotes ?? [],
      interventionsSent: record.interventionsSent ?? [],
      nudgeTemplates: [
        { key: "stalled_step_auto", label: "Auto-match current stalled step", description: "Uses the tenant's current step to choose the right reminder.", message: NUDGE_TEMPLATE_MAP.stalled_onboarding.message },
        ...Object.entries(NUDGE_TEMPLATE_MAP).map(([key, value]) => ({
          key,
          label: value.label,
          description: value.description,
          message: value.message,
        })),
      ],
    };
  },
});

export const assignAccountManager = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    accountManagerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    const onboarding = await ensureOnboardingRecord(ctx, args.tenantId);
    const now = Date.now();

    await ctx.db.patch(onboarding._id, {
      assignedAccountManager: args.accountManagerUserId,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "tenant.updated",
      entityType: "tenant_onboarding",
      entityId: args.tenantId,
      after: {
        tenantId: args.tenantId,
        assignedAccountManager: args.accountManagerUserId,
      },
    });

    return { success: true };
  },
});

export const addPlatformOnboardingNote = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    const onboarding = await ensureOnboardingRecord(ctx, args.tenantId);
    const trimmedNote = args.note.trim();

    if (!trimmedNote) {
      throw new Error("A note is required");
    }

    const now = Date.now();
    const nextNotes = [
      ...(onboarding.platformNotes ?? []),
      {
        id: crypto.randomUUID(),
        note: trimmedNote,
        authorId: platform.userId,
        authorEmail: platform.email,
        createdAt: now,
      },
    ];

    await ctx.db.patch(onboarding._id, {
      platformNotes: nextNotes,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "tenant.updated",
      entityType: "tenant_onboarding",
      entityId: args.tenantId,
      after: {
        tenantId: args.tenantId,
        note: trimmedNote,
      },
    });

    return { success: true };
  },
});

export const sendOnboardingNudge = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.string(),
    template: v.optional(v.string()),
    message: v.optional(v.string()),
    sendEmail: v.optional(v.boolean()),
    sendSms: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    const [tenantRecord, onboarding, schoolAdmins] = await Promise.all([
      getTenantRecord(ctx, args.tenantId),
      ensureOnboardingRecord(ctx, args.tenantId),
      getSchoolAdmins(ctx, args.tenantId),
    ]);

    if (!tenantRecord) {
      throw new Error("Tenant not found");
    }

    const selectedTemplate = getNudgeTemplateMessage(args.template ?? "stalled_onboarding", onboarding.currentStep);
    const templateKey = selectedTemplate.templateKey;
    const baseMessage = args.message?.trim() || selectedTemplate.message;
    const now = Date.now();
    const nextInterventions = [...(onboarding.interventionsSent ?? [])];

    for (const admin of schoolAdmins) {
      if ((args.sendEmail ?? true) && admin.email) {
        await ctx.scheduler.runAfter(0, internal.actions.communications.email.sendEmailInternal, {
          tenantId: args.tenantId,
          actorId: platform.userId,
          actorEmail: platform.email,
          to: [admin.email],
          subject: "EduMyles onboarding nudge",
          text: `${baseMessage}\n\nOpen your setup wizard here: ${getAppUrl()}/admin/setup`,
          template: "stalled_onboarding_nudge",
          data: {
            schoolName: tenantRecord?.name ?? "your school",
            currentStepLabel: STEP_TITLES[onboardingStepNames[Math.max(0, onboarding.currentStep - 1)] ?? "schoolProfile"],
            message: baseMessage,
            setupUrl: `${getAppUrl()}/admin/setup`,
          },
        });
        nextInterventions.push({
          type: templateKey,
          sentAt: now,
          channel: `email:${admin.email}`,
        });
      }

      if ((args.sendSms ?? true) && admin.phone) {
        await ctx.scheduler.runAfter(0, internal.actions.communications.sms.sendSmsInternal, {
          tenantId: args.tenantId,
          actorId: platform.userId,
          actorEmail: platform.email,
          phone: admin.phone,
          message: `${baseMessage} Open EduMyles setup to continue.`,
        });
        nextInterventions.push({
          type: templateKey,
          sentAt: now,
          channel: `sms:${admin.phone}`,
        });
      }

      await ctx.db.insert("notifications", {
        tenantId: args.tenantId,
        userId: admin.eduMylesUserId,
        title: "EduMyles onboarding nudge",
        message: baseMessage,
        type: "onboarding",
        isRead: false,
        link: "/admin/setup",
        createdAt: now,
      });
    }

    await ctx.db.patch(onboarding._id, {
      interventionsSent: nextInterventions,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "communication.broadcast_sent",
      entityType: "tenant_onboarding",
      entityId: args.tenantId,
      after: {
        tenantId: args.tenantId,
        template: templateKey,
        sendEmail: args.sendEmail ?? true,
        sendSms: args.sendSms ?? true,
      },
    });

    return { success: true };
  },
});

export const recordTrialIntervention = internalMutation({
  args: {
    tenantId: v.string(),
    interventionType: v.union(
      v.literal("email"),
      v.literal("in_app"),
      v.literal("sms"),
      v.literal("call_scheduled")
    ),
    trigger: v.union(
      v.literal("day_1"),
      v.literal("day_3"),
      v.literal("day_7"),
      v.literal("day_10"),
      v.literal("day_12"),
      v.literal("day_13"),
      v.literal("day_14")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("trial_interventions")
      .withIndex("by_tenant_trigger", (q) =>
        q.eq("tenantId", args.tenantId).eq("trigger", args.trigger)
      )
      .first();

    if (existing) {
      return { success: true, duplicate: true };
    }

    const interventionId = await ctx.db.insert("trial_interventions", {
      tenantId: args.tenantId,
      interventionType: args.interventionType,
      trigger: args.trigger,
      sentAt: Date.now(),
      opened: undefined,
      clicked: undefined,
      createdAt: Date.now(),
    });

    return { success: true, interventionId };
  },
});
