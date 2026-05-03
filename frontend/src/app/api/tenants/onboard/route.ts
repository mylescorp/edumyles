import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  buildWorkOSSignUpUrl,
  ensureTenantWorkOSOrganization,
  getWorkOSClientFromEnv,
} from "@/lib/workos-invitations";

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

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    const warnings: string[] = [];

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
      sendWelcomeImmediately: Boolean(sendWelcomeImmediately),
      primaryCampus: payload.primaryCampus,
      additionalCampuses: payload.additionalCampuses,
    });

    tenantId = provisionResult.tenantId;

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
          "WorkOS is not configured yet. The tenant was provisioned with a placeholder organization and the admin invite email was not sent."
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
    });

    let invitationId: string | null = null;
    let signUpUrl: string | null = null;

    try {
      signUpUrl = buildWorkOSSignUpUrl(req, String(adminEmail).trim().toLowerCase());
    } catch (error: any) {
      if (error?.message?.includes("WORKOS_NOT_CONFIGURED")) {
        warnings.push(
          "WorkOS sign-up links are unavailable until WorkOS environment variables are configured."
        );
      } else {
        throw error;
      }
    }

    if (sendWelcomeImmediately !== false && organization) {
      try {
        stage = "sending_workos_invitation";
        const { workos } = getWorkOSClientFromEnv();
        const invitation = await workos.userManagement.sendInvitation({
          email: String(adminEmail).trim().toLowerCase(),
          organizationId: organization.workosOrgId,
          expiresInDays: 7,
        });
        invitationId = invitation.id;
      } catch (error: any) {
        if (error?.message?.includes("WORKOS_NOT_CONFIGURED")) {
          warnings.push(
            "The tenant admin invite record was created, but the WorkOS email invitation could not be sent because WorkOS is not configured."
          );
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json({
      success: true,
      tenantId,
      tenantDocId: provisionResult.tenantDocId,
      organizationId: organization?.organizationId ?? null,
      workosOrgId: organization?.workosOrgId ?? null,
      invitationId,
      inviteToken: (inviteRecord as any).inviteToken ?? null,
      inviteRecordId: (inviteRecord as any).tenantInviteId ?? null,
      signUpUrl,
      invitationQueued: Boolean(invitationId),
      warnings,
      tenantName: payload.schoolName,
      subdomain: provisionResult.subdomain,
      tenantUrl: provisionResult.tenantUrl,
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
