import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { ensureTenantWorkOSOrganization } from "@/lib/workos-invitations";
import { ensureFrontendDomain } from "@/lib/vercel-domains";

type OnboardingPreflight = {
  ok: boolean;
  failures: string[];
  warnings: string[];
};

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

function addMissingEnv(failures: string[], names: string[]) {
  for (const name of names) {
    if (!hasEnv(name)) failures.push(`Missing required env: ${name}`);
  }
}

function validateUrl(failures: string[], name: string, { requireHttps = false } = {}) {
  const value = process.env[name]?.trim();
  if (!value) return;
  try {
    const parsed = new URL(value);
    if (requireHttps && parsed.protocol !== "https:") {
      failures.push(`${name} must use HTTPS in production`);
    }
  } catch {
    failures.push(`${name} must be a valid URL`);
  }
}

function validateTenantOnboardingPreflight(payload: Record<string, any>): OnboardingPreflight {
  const failures: string[] = [];
  const warnings: string[] = [];
  const sendWelcomeImmediately = payload.sendWelcomeImmediately !== false;
  const allowPartialOnboarding = payload.allowPartialOnboarding === true;

  for (const field of [
    "schoolName",
    "country",
    "county",
    "adminEmail",
    "adminFirstName",
    "adminLastName",
    "adminJobTitle",
    "planId",
    "billingCycle",
    "trialDays",
    "paymentCollectionMode",
    "timezone",
    "displayCurrency",
    "academicYearStartMonth",
    "termStructure",
  ]) {
    if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === "") {
      failures.push(`Missing onboarding field: ${field}`);
    }
  }

  if (payload.subdomain && !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(String(payload.subdomain))) {
    failures.push("subdomain must be 3-63 lowercase letters, numbers, or hyphens");
  }

  if (!Array.isArray(payload.selectedModuleIds)) {
    warnings.push("selectedModuleIds was not provided as an array; onboarding will default to plan modules.");
  }

  addMissingEnv(failures, ["NEXT_PUBLIC_CONVEX_URL", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_ROOT_DOMAIN"]);
  validateUrl(failures, "NEXT_PUBLIC_CONVEX_URL", { requireHttps: isProductionRuntime() });
  validateUrl(failures, "NEXT_PUBLIC_APP_URL", { requireHttps: isProductionRuntime() });

  if (isProductionRuntime()) {
    addMissingEnv(failures, [
      "WORKOS_API_KEY",
      "WORKOS_CLIENT_ID",
      "NEXT_PUBLIC_WORKOS_CLIENT_ID",
      "WORKOS_REDIRECT_URI",
      "WORKOS_COOKIE_PASSWORD",
      "WORKOS_WEBHOOK_SECRET",
    ]);

    if (sendWelcomeImmediately) {
      addMissingEnv(failures, ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_SUPPORT_EMAIL"]);
    }

    const shouldProvisionFrontendDomain = payload.skipDomainProvisioning !== true;
    if (shouldProvisionFrontendDomain) {
      addMissingEnv(failures, ["VERCEL_TOKEN", "VERCEL_FRONTEND_PROJECT_ID"]);
    }

    if (process.env.ENABLE_DEV_AUTH_BYPASS === "true") {
      failures.push("ENABLE_DEV_AUTH_BYPASS must not be true in production");
    }
    if (process.env.SOCIAL_SANDBOX_MODE === "true") {
      failures.push("SOCIAL_SANDBOX_MODE must not be true in production");
    }
  }

  if (allowPartialOnboarding && failures.length > 0) {
    warnings.push(
      `Partial onboarding explicitly allowed; production preflight failures will be bypassed: ${failures.join("; ")}`
    );
    return { ok: true, failures: [], warnings };
  }

  return { ok: failures.length === 0, failures, warnings };
}

export async function POST(req: NextRequest) {
  let tenantId: string | undefined;
  let stage = "validating_request";

  try {
    const body = await req.json();
    const payload = body as Record<string, any>;
    const sessionToken = payload.sessionToken;
    const adminEmail = payload.adminEmail;
    const adminFirstName = payload.adminFirstName;
    const adminLastName = payload.adminLastName;
    const sendWelcomeImmediately = payload.sendWelcomeImmediately;
    const welcomeMessage = payload.welcomeMessage;

    if (!sessionToken || !adminEmail || !adminFirstName || !adminLastName) {
      return NextResponse.json({ error: "Missing required onboarding fields" }, { status: 400 });
    }

    const preflight = validateTenantOnboardingPreflight(payload);
    if (payload.dryRun === true || payload.preflightOnly === true) {
      return NextResponse.json(
        {
          success: preflight.ok,
          dryRun: true,
          preflight,
        },
        { status: preflight.ok ? 200 : 412 }
      );
    }
    if (!preflight.ok) {
      return NextResponse.json(
        {
          error: "Tenant onboarding preflight failed",
          stage,
          preflight,
        },
        { status: 412 }
      );
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    const warnings: string[] = [...preflight.warnings];

    stage = "provisioning_tenant";
    const provisionResult = await convex.mutation(api.platform.tenants.mutations.provisionTenant, {
      sessionToken,
      organizationMode: payload.organizationMode,
      networkName: payload.networkName,
      schoolName: payload.schoolName,
      schoolType: payload.schoolType,
      country: payload.country,
      county: payload.county,
      address: payload.address,
      websiteUrl: payload.websiteUrl,
      logoUrl: payload.logoUrl,
      adminEmail,
      adminFirstName,
      adminLastName,
      adminPhone: payload.adminPhone,
      adminJobTitle: payload.adminJobTitle,
      sendMagicLink: Boolean(payload.sendMagicLink),
      planId: payload.planId,
      billingCycle: payload.billingCycle,
      customPriceMonthlyKes: payload.customPriceMonthlyKes,
      customPriceAnnualKes: payload.customPriceAnnualKes,
      trialDays: payload.trialDays,
      studentCountEstimate: payload.studentCountEstimate,
      paymentCollectionMode: payload.paymentCollectionMode,
      subdomain: payload.subdomain,
      customDomain: payload.customDomain,
      timezone: payload.timezone,
      displayCurrency: payload.displayCurrency,
      academicYearStartMonth: payload.academicYearStartMonth,
      termStructure: payload.termStructure,
      curriculumMode: payload.curriculumMode,
      primaryCurriculumCode: payload.primaryCurriculumCode,
      activeCurriculumCodes: payload.activeCurriculumCodes ?? [],
      selectedModuleIds: payload.selectedModuleIds ?? [],
      pilotGrantModuleIds: payload.pilotGrantModuleIds ?? [],
      welcomeTemplate: payload.welcomeTemplate,
      welcomeMessage,
      sendWelcomeImmediately: sendWelcomeImmediately !== false,
      primaryCampus: payload.primaryCampus,
      additionalCampuses: payload.additionalCampuses,
    });

    tenantId = provisionResult.tenantId;

    stage = "provisioning_frontend_domain";
    let domainProvisioning: Awaited<ReturnType<typeof ensureFrontendDomain>> | null = null;
    try {
      domainProvisioning =
        payload.skipDomainProvisioning === true
          ? { configured: false, reason: "skip_domain_provisioning_requested" }
          : await ensureFrontendDomain(provisionResult.tenantUrl?.replace(/^https?:\/\//, ""));
    } catch (error: any) {
      warnings.push(error?.message ?? "The tenant was created, but the frontend domain could not be registered automatically.");
    }

    stage = "provisioning_workos_organization";
    let organization: {
      tenant: any;
      organizationId: string;
      workosOrgId: string;
      alreadyExists: boolean;
    } | null = null;

    try {
      organization = await ensureTenantWorkOSOrganization({
        convex,
        tenantId: tenantId!,
        sessionToken,
      });
    } catch (error: any) {
      if (error?.message?.includes("WORKOS_NOT_CONFIGURED")) {
        warnings.push(
          "WorkOS is not configured yet. The tenant was provisioned with a placeholder organization, but the admin invite email still uses the EduMyles Resend flow."
        );
        const existingOrganization = await convex.query(api.organizations.getOrgByTenantId, {
          tenantId,
          sessionToken,
        });
        if (!existingOrganization) {
          throw error;
        }
        organization = {
          tenant: null,
          organizationId: String(existingOrganization._id),
          workosOrgId: existingOrganization.workosOrgId ?? `edumyles-${tenantId}`,
          alreadyExists: true,
        };
      } else {
        throw error;
      }
    }

    stage = "creating_admin_invite_record";
    const inviteRecord = await convex.mutation(api.platform.tenants.mutations.inviteTenantAdmin, {
      sessionToken,
      tenantId,
      email: String(adminEmail).trim().toLowerCase(),
      firstName: String(adminFirstName).trim(),
      lastName: String(adminLastName).trim(),
      role: "school_admin",
      personalMessage:
        typeof welcomeMessage === "string" && welcomeMessage.trim().length > 0
          ? welcomeMessage.trim()
          : undefined,
      expiresInDays: 7,
      sendEmail: sendWelcomeImmediately !== false,
    });

    const signUpUrl = (inviteRecord as any).inviteUrl ?? null;
    const invitationQueued = Boolean((inviteRecord as any).emailQueued);

    return NextResponse.json({
      success: true,
      tenantId,
      tenantDocId: provisionResult.tenantDocId,
      organizationId: organization?.organizationId ?? null,
      workosOrgId: organization?.workosOrgId ?? null,
      invitationId: null,
      inviteToken: (inviteRecord as any).inviteToken ?? null,
      inviteRecordId: (inviteRecord as any).tenantInviteId ?? null,
      inviteUrl: (inviteRecord as any).inviteUrl ?? null,
      signUpUrl,
      invitationQueued,
      warnings,
      tenantName: payload.schoolName,
      subdomain: provisionResult.subdomain,
      tenantUrl: provisionResult.tenantUrl,
      domainProvisioning,
    });
  } catch (error: any) {
    console.error("[tenants/onboard] Error:", error);
    const message = error?.message ?? "Failed to complete tenant onboarding";
    const status = message.includes("CONFLICT") ? 409 : message.includes("NOT_FOUND") ? 404 : 500;

    return NextResponse.json(
      {
        error: message,
        stage,
        tenantId,
      },
      { status }
    );
  }
}
