"use node";

import { WorkOS } from "@workos-inc/node";
import { internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";

function getWorkOSClient() {
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

async function logFailure(ctx: any, action: string, error: unknown, after?: Record<string, unknown>) {
  await ctx.runMutation(internal.helpers.auditLog.internalLogAction, {
    tenantId: "PLATFORM",
    actorId: "system",
    actorEmail: "system@edumyles.co.ke",
    action: "integration.configured",
    entityType: "workos_action_failure",
    entityId: action,
    after: {
      action,
      message: error instanceof Error ? error.message : "Unknown WorkOS error",
      ...after,
    },
  });
}

export const createOrganization = internalAction({
  args: {
    name: v.string(),
    domains: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    try {
      const { workos } = getWorkOSClient();
      const organization = await workos.organizations.createOrganization({
        name: args.name,
      });
      return organization.id;
    } catch (error) {
      await logFailure(ctx, "createOrganization", error, { name: args.name, domains: args.domains ?? [] });
      throw error;
    }
  },
});

export const createUser = internalAction({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { workos } = getWorkOSClient();
      const user = await workos.userManagement.createUser({
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        password: args.password,
      });

      await workos.userManagement.sendVerificationEmail({
        userId: user.id,
      });

      return user.id;
    } catch (error) {
      await logFailure(ctx, "createUser", error, { email: args.email });
      throw error;
    }
  },
});

export const createOrganizationMembership = internalAction({
  args: {
    userId: v.string(),
    organizationId: v.string(),
    roleSlug: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { workos } = getWorkOSClient();
      await workos.userManagement.createOrganizationMembership({
        userId: args.userId,
        organizationId: args.organizationId,
        roleSlug: args.roleSlug,
      });
      return null;
    } catch (error) {
      await logFailure(ctx, "createOrganizationMembership", error, args);
      throw error;
    }
  },
});

export const inviteUserToOrganization = internalAction({
  args: {
    email: v.string(),
    organizationId: v.string(),
    roleSlug: v.string(),
    inviterUserId: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { workos } = getWorkOSClient();
        const invitation = await workos.userManagement.sendInvitation({
          email: args.email,
          organizationId: args.organizationId,
          roleSlug: args.roleSlug,
          inviterUserId: args.inviterUserId,
        });
      return invitation.token ?? invitation.id;
    } catch (error) {
      await logFailure(ctx, "inviteUserToOrganization", error, {
        email: args.email,
        organizationId: args.organizationId,
        roleSlug: args.roleSlug,
      });
      throw error;
    }
  },
});

export const getOrganizationAuthUrl = internalAction({
  args: {
    organizationId: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { workos, clientId } = getWorkOSClient();
      return workos.userManagement.getAuthorizationUrl({
        clientId,
        organizationId: args.organizationId,
        redirectUri: args.redirectUri,
      });
    } catch (error) {
      await logFailure(ctx, "getOrganizationAuthUrl", error, args);
      throw error;
    }
  },
});

export const deleteOrganization = internalAction({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { workos } = getWorkOSClient();
      await workos.organizations.deleteOrganization(args.organizationId);
      return null;
    } catch (error) {
      await logFailure(ctx, "deleteOrganization", error, args);
      throw error;
    }
  },
});

export const revokeUserSessions = internalAction({
  args: {
    workosUserId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { workos } = getWorkOSClient();
      const sessions = await workos.userManagement.listSessions(args.workosUserId);

      for (const session of sessions.data ?? []) {
        await workos.userManagement.revokeSession({
          sessionId: session.id,
        });
      }

      return { revokedCount: sessions.data?.length ?? 0 };
    } catch (error) {
      await logFailure(ctx, "revokeUserSessions", error, args);
      throw error;
    }
  },
});
