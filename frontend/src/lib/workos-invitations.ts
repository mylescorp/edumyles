import { NextRequest } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";
import { resolveWorkOSRedirectUri } from "@/lib/workos-redirect";

export function getWorkOSClientFromEnv() {
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID || process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;

  if (!apiKey || !clientId) {
    throw new Error("WORKOS_NOT_CONFIGURED");
  }

  return {
    workos: new WorkOS(apiKey),
    clientId,
  };
}

export function buildWorkOSSignUpUrl(req: NextRequest, email: string, returnTo?: string) {
  const { workos, clientId } = getWorkOSClientFromEnv();
  const state = Buffer.from(
    JSON.stringify({
      nonce: crypto.randomBytes(8).toString("hex"),
      mode: "sign-up",
      returnTo: returnTo?.startsWith("/") ? returnTo : undefined,
    })
  ).toString("base64url");

  return workos.userManagement.getAuthorizationUrl({
    clientId,
    redirectUri: resolveWorkOSRedirectUri(req),
    provider: "authkit",
    screenHint: "sign-up",
    loginHint: email,
    state,
  });
}

export async function ensureTenantWorkOSOrganization(args: {
  convex: ConvexHttpClient;
  tenantId: string;
  sessionToken?: string;
  serverSecret?: string;
}) {
  const { workos } = getWorkOSClientFromEnv();
  const tenant = await args.convex.query(api.tenants.getTenantByTenantId, {
    tenantId: args.tenantId,
  });

  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }

  const org = await args.convex.query(api.organizations.getOrgByTenantId, {
    tenantId: args.tenantId,
    ...(args.serverSecret ? { serverSecret: args.serverSecret } : { sessionToken: args.sessionToken ?? "" }),
  });

  if (
    org?.workosOrgId &&
    !org.workosOrgId.startsWith("edumyles-") &&
    !org.workosOrgId.startsWith("platform-")
  ) {
    return {
      tenant,
      organizationId: org._id,
      workosOrgId: org.workosOrgId,
      alreadyExists: true,
    };
  }

  const created = await workos.organizations.createOrganization({
    name: tenant.name,
  });

  const organizationId = await args.convex.mutation(api.organizations.upsertOrganization, {
    tenantId: args.tenantId,
    workosOrgId: created.id,
    name: tenant.name,
    subdomain: tenant.subdomain,
    tier: (tenant.plan as "starter" | "standard" | "pro" | "enterprise") ?? "starter",
    ...(args.serverSecret ? { serverSecret: args.serverSecret } : { sessionToken: args.sessionToken ?? "" }),
  });

  return {
    tenant,
    organizationId,
    workosOrgId: created.id,
    alreadyExists: false,
  };
}
