"use node";

import { WorkOS } from "@workos-inc/node";
import { ConvexError, v } from "convex/values";
import { internal } from "../../_generated/api";
import { internalAction } from "../../_generated/server";

function getPlatformWorkOSClient() {
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID;
  const organizationId = process.env.WORKOS_PLATFORM_ORG_ID;
  const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL;

  if (!apiKey) {
    throw new ConvexError({
      code: "CONFIGURATION_ERROR",
      message: "WORKOS_API_KEY is not configured",
    });
  }

  if (!clientId) {
    throw new ConvexError({
      code: "CONFIGURATION_ERROR",
      message: "WORKOS_CLIENT_ID is not configured",
    });
  }

  if (!organizationId) {
    throw new ConvexError({
      code: "CONFIGURATION_ERROR",
      message: "WORKOS_PLATFORM_ORG_ID is not configured",
    });
  }

  if (!platformUrl) {
    throw new ConvexError({
      code: "CONFIGURATION_ERROR",
      message: "NEXT_PUBLIC_PLATFORM_URL is not configured",
    });
  }

  return {
    workos: new WorkOS(apiKey),
    clientId,
    organizationId,
    platformUrl,
  };
}

async function logFailure(
  ctx: any,
  action: string,
  error: unknown,
  after?: Record<string, unknown>
) {
  await ctx.runMutation(internal.helpers.auditLog.internalLogAction, {
    tenantId: "PLATFORM",
    actorId: "system",
    actorEmail: "system@edumyles.co.ke",
    action: "integration.configured",
    entityType: "platform_workos_failure",
    entityId: action,
    after: {
      action,
      message: error instanceof Error ? error.message : "Unknown WorkOS error",
      ...after,
    },
  });
}

function normalizeWorkOSError(error: unknown, fallback: string) {
  if (error instanceof ConvexError) return error;

  const message = error instanceof Error ? error.message : fallback;
  if (message.toLowerCase().includes("email_already_in_use")) {
    return new ConvexError({
      code: "EMAIL_ALREADY_IN_USE",
      message: "A WorkOS user with this email already exists.",
    });
  }

  return new ConvexError({
    code: "WORKOS_ERROR",
    message,
  });
}

export const createPlatformUser = internalAction({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const { workos } = getPlatformWorkOSClient();
      const user = await workos.userManagement.createUser({
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        password: args.password,
      });

      await workos.userManagement.sendVerificationEmail({
        userId: user.id,
      });

      return { workosUserId: user.id };
    } catch (error) {
      await logFailure(ctx, "createPlatformUser", error, { email: args.email });
      throw normalizeWorkOSError(error, "Failed to create platform WorkOS user.");
    }
  },
});

export const sendPlatformInvitation = internalAction({
  args: {
    email: v.string(),
    inviterUserId: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { workos, organizationId } = getPlatformWorkOSClient();
      const invitation = await workos.userManagement.sendInvitation({
        email: args.email,
        organizationId,
        inviterUserId: args.inviterUserId,
      });

      return {
        workosInvitationToken: invitation.token ?? invitation.id,
      };
    } catch (error) {
      await logFailure(ctx, "sendPlatformInvitation", error, { email: args.email });
      throw normalizeWorkOSError(error, "Failed to send platform invitation.");
    }
  },
});

export const addToPlatformOrganization = internalAction({
  args: {
    workosUserId: v.string(),
    roleSlug: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { workos, organizationId } = getPlatformWorkOSClient();
      await workos.userManagement.createOrganizationMembership({
        userId: args.workosUserId,
        organizationId,
        roleSlug: args.roleSlug,
      });

      return { success: true };
    } catch (error) {
      await logFailure(ctx, "addToPlatformOrganization", error, args);
      throw normalizeWorkOSError(error, "Failed to add user to platform organization.");
    }
  },
});

export const getWorkOSUser = internalAction({
  args: {
    workosUserId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { workos } = getPlatformWorkOSClient();
      const user = await workos.userManagement.getUser(args.workosUserId);

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      await logFailure(ctx, "getWorkOSUser", error, args);
      throw normalizeWorkOSError(error, "Failed to fetch WorkOS user.");
    }
  },
});

export const listPlatformOrgMembers = internalAction({
  args: {
    limit: v.optional(v.number()),
    after: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const { workos, organizationId } = getPlatformWorkOSClient();
      const memberships = await workos.userManagement.listOrganizationMemberships({
        organizationId,
        limit: args.limit,
        after: args.after,
      });

      return {
        data: memberships.data ?? [],
        listMetadata: memberships.listMetadata ?? null,
      };
    } catch (error) {
      await logFailure(ctx, "listPlatformOrgMembers", error, args);
      throw normalizeWorkOSError(error, "Failed to list platform organization members.");
    }
  },
});

export const updateWorkOSUser = internalAction({
  args: {
    workosUserId: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const { workos } = getPlatformWorkOSClient();
      const user = await workos.userManagement.updateUser({
        userId: args.workosUserId,
        firstName: args.firstName,
        lastName: args.lastName,
        emailVerified: args.emailVerified,
      });

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      };
    } catch (error) {
      await logFailure(ctx, "updateWorkOSUser", error, args);
      throw normalizeWorkOSError(error, "Failed to update WorkOS user.");
    }
  },
});

export const resetWorkOSPassword = internalAction({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { workos, platformUrl } = getPlatformWorkOSClient();
      await (workos.userManagement as any).sendPasswordResetEmail({
        email: args.email,
        passwordResetUrl: `${platformUrl}/platform/auth/reset-password`,
      });

      return { success: true };
    } catch (error) {
      await logFailure(ctx, "resetWorkOSPassword", error, args);
      throw normalizeWorkOSError(error, "Failed to send WorkOS password reset email.");
    }
  },
});

export const removeFromPlatformOrganization = internalAction({
  args: {
    workosUserId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { workos, organizationId } = getPlatformWorkOSClient();
      const memberships = await workos.userManagement.listOrganizationMemberships({
        organizationId,
      });

      const relevant = (memberships.data ?? []).filter(
        (membership: any) => membership.userId === args.workosUserId
      );

      for (const membership of relevant) {
        await workos.userManagement.deleteOrganizationMembership(membership.id);
      }

      return { removedCount: relevant.length };
    } catch (error) {
      await logFailure(ctx, "removeFromPlatformOrganization", error, args);
      throw normalizeWorkOSError(error, "Failed to remove WorkOS memberships.");
    }
  },
});

export const deletePlatformWorkOSUser = internalAction({
  args: {
    workosUserId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { workos } = getPlatformWorkOSClient();
      await workos.userManagement.deleteUser(args.workosUserId);
      return { success: true };
    } catch (error) {
      await logFailure(ctx, "deletePlatformWorkOSUser", error, args);
      throw normalizeWorkOSError(error, "Failed to delete WorkOS user.");
    }
  },
});

export const revokeAllPlatformUserSessions = internalAction({
  args: {
    workosUserId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { workos } = getPlatformWorkOSClient();
      const sessions = await workos.userManagement.listSessions(args.workosUserId);

      for (const session of sessions.data ?? []) {
        await workos.userManagement.revokeSession({
          sessionId: session.id,
        });
      }

      return { revokedCount: sessions.data?.length ?? 0 };
    } catch (error) {
      await logFailure(ctx, "revokeAllPlatformUserSessions", error, args);
      throw normalizeWorkOSError(error, "Failed to revoke WorkOS sessions.");
    }
  },
});

export const revokeSingleSession = internalAction({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { workos } = getPlatformWorkOSClient();
      await workos.userManagement.revokeSession({
        sessionId: args.sessionId,
      });
      return { success: true };
    } catch (error) {
      await logFailure(ctx, "revokeSingleSession", error, args);
      throw normalizeWorkOSError(error, "Failed to revoke WorkOS session.");
    }
  },
});
