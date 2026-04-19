"use node";

import { action } from "../../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../../_generated/api";

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function isWorkOSNotConfigured(error: unknown) {
  return error instanceof Error && error.message.includes("WORKOS_NOT_CONFIGURED");
}

type AcceptTenantInviteResult = {
  tenantId: string;
  tenantDocId: unknown;
  userId: string;
  email: string;
  role: string;
  slug: string;
  workosUserId: string;
  redirectTo: string;
};

export const acceptTenantInvite = action({
  args: {
    token: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<AcceptTenantInviteResult> => {
    const invite = await ctx.runQuery(api.platform.tenants.queries.getTenantInviteByToken, {
      token: args.token,
    });

    if (!invite) {
      throw new Error("Invalid invitation");
    }

    if (invite.isUsed) {
      throw new Error("This invitation has already been used");
    }

    if (invite.isRevoked) {
      throw new Error("This invitation has been revoked");
    }

    if (invite.isExpired || !invite.isValid) {
      throw new Error("This invitation has expired");
    }

    let workosOrgId: string | null = null;
    let workosUserId: string | null = null;

    try {
      try {
        workosOrgId = await ctx.runAction(internal.actions.auth.workos.createOrganization, {
          name: invite.schoolName ?? `${args.firstName}'s School`,
          domains: [],
        });

        workosUserId = await ctx.runAction(internal.actions.auth.workos.createUser, {
          email: invite.email,
          firstName: args.firstName,
          lastName: args.lastName,
          password: args.password,
        });

        await ctx.runAction(internal.actions.auth.workos.createOrganizationMembership, {
          userId: workosUserId,
          organizationId: workosOrgId,
          roleSlug: "admin",
        });
      } catch (error) {
        if (!isWorkOSNotConfigured(error)) {
          throw error;
        }

        workosOrgId = `placeholder-org-${crypto.randomUUID()}`;
        workosUserId = `placeholder-user-${crypto.randomUUID()}`;
      }

      const result: Omit<AcceptTenantInviteResult, "redirectTo"> = await ctx.runMutation(
        internal.platform.tenants.mutations.createTenantFromInvite,
        {
          inviteToken: args.token,
          workosOrgId,
          workosUserId,
          firstName: args.firstName,
          lastName: args.lastName,
          phone: args.phone,
        }
      );

      const redirectTo = `${getAppUrl()}/admin/setup`;

      return {
        ...result,
        redirectTo,
      };
    } catch (error) {
      if (workosOrgId && !workosOrgId.startsWith("placeholder-org-")) {
        try {
          await ctx.runAction(internal.actions.auth.workos.deleteOrganization, {
            organizationId: workosOrgId,
          });
        } catch {
          // Best-effort cleanup; WorkOS failures are already audit-logged in the action layer.
        }
      }

      throw error;
    }
  },
});
