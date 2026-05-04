import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { canRunPrivilegedDevActions, normalizeDevRole } from "@/lib/dev/access";
import type {
  DevRbacAuditEntry,
  DevRbacData,
  DevRbacPermissionDefinition,
  DevRbacRole,
  DevRbacUser,
} from "@/lib/dev/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  return new ConvexHttpClient(convexUrl);
}

async function requireRbacSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("edumyles_session")?.value ?? null;
  const role = normalizeDevRole(cookieStore.get("edumyles_role")?.value ?? null);

  if (!sessionToken || !canRunPrivilegedDevActions(role)) {
    return null;
  }

  return { sessionToken, role };
}

function normalizePermissions(catalog: unknown): DevRbacPermissionDefinition[] {
  if (!catalog || typeof catalog !== "object") return [];

  return Object.entries(catalog as Record<string, unknown>).flatMap(([group, entries]) => {
    if (!Array.isArray(entries)) return [];
    return entries.map((entry) => ({
      key: String(entry?.key ?? ""),
      label: String(entry?.label ?? entry?.key ?? ""),
      description: String(entry?.description ?? ""),
      group,
    }));
  }).filter((entry) => entry.key);
}

function normalizeRole(raw: any): DevRbacRole {
  return {
    id: String(raw.id ?? raw._id ?? raw.slug),
    name: String(raw.name ?? raw.slug),
    slug: String(raw.slug ?? raw.id),
    description: raw.description ? String(raw.description) : undefined,
    baseRole: raw.baseRole ? String(raw.baseRole) : undefined,
    isSystem: Boolean(raw.isSystem),
    isActive: raw.isActive !== false,
    color: raw.color ? String(raw.color) : undefined,
    icon: raw.icon ? String(raw.icon) : undefined,
    permissions: Array.isArray(raw.permissions) ? raw.permissions.map(String) : [],
    userCount: Number(raw.userCount ?? 0),
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : undefined,
  };
}

function normalizeUser(raw: any): DevRbacUser {
  return {
    id: String(raw.id ?? raw._id ?? raw.userId),
    userId: raw.userId ? String(raw.userId) : undefined,
    email: String(raw.email ?? "unknown@example.com"),
    firstName: raw.firstName ? String(raw.firstName) : undefined,
    lastName: raw.lastName ? String(raw.lastName) : undefined,
    role: String(raw.role ?? "unknown"),
    status: raw.status ? String(raw.status) : undefined,
    department: raw.department ? String(raw.department) : undefined,
    addedPermissions: Array.isArray(raw.addedPermissions) ? raw.addedPermissions.map(String) : [],
    removedPermissions: Array.isArray(raw.removedPermissions) ? raw.removedPermissions.map(String) : [],
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : undefined,
  };
}

function normalizeAudit(raw: any): DevRbacAuditEntry {
  return {
    id: String(raw.id ?? raw._id ?? `${raw.targetUserId ?? "entry"}:${raw.createdAt ?? Date.now()}`),
    targetUserId: raw.targetUserId ? String(raw.targetUserId) : undefined,
    changedBy: raw.changedBy ? String(raw.changedBy) : undefined,
    changeType: raw.changeType ? String(raw.changeType) : undefined,
    changeSummary: raw.changeSummary ? String(raw.changeSummary) : undefined,
    permissionKey: raw.permissionKey ? String(raw.permissionKey) : undefined,
    roleSlug: raw.roleSlug ? String(raw.roleSlug) : undefined,
    createdAt: Number(raw.createdAt ?? Date.now()),
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireRbacSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const convex = getConvexClient();
    const search = request.nextUrl.searchParams.get("search") ?? undefined;

    const [rolesRaw, catalogRaw, usersRaw, auditRaw] = await Promise.all([
      convex.query((api.modules.platform.rbac as any).getRoles, {
        sessionToken: session.sessionToken,
        includeSystem: true,
        includeInactive: true,
      }),
      convex.query((api.modules.platform.rbac as any).getPermissionCatalog, {
        sessionToken: session.sessionToken,
      }),
      convex.query((api.modules.platform.rbac as any).getPlatformUsers, {
        sessionToken: session.sessionToken,
        search,
      }),
      convex.query((api.modules.platform.rbac as any).getPermissionAuditLog, {
        sessionToken: session.sessionToken,
      }).catch(() => []),
    ]);

    const payload: DevRbacData = {
      roles: Array.isArray(rolesRaw) ? rolesRaw.map(normalizeRole) : [],
      permissions: normalizePermissions(catalogRaw),
      users: Array.isArray(usersRaw) ? usersRaw.map(normalizeUser) : [],
      audit: Array.isArray(auditRaw) ? auditRaw.map(normalizeAudit).slice(0, 50) : [],
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[api/dev/rbac] Failed to load RBAC data", error);
    return NextResponse.json({ error: "Failed to load RBAC data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRbacSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const convex = getConvexClient();
    const rbac = api.modules.platform.rbac as any;

    if (body?.action === "createRole") {
      const result = await convex.mutation(rbac.createRole, {
        sessionToken: session.sessionToken,
        name: String(body.name ?? ""),
        description: String(body.description ?? ""),
        baseRole: body.baseRole ? String(body.baseRole) : undefined,
        color: String(body.color ?? "#2563EB"),
        icon: String(body.icon ?? "shield-check"),
        permissions: Array.isArray(body.permissions) ? body.permissions.map(String) : [],
      });
      return NextResponse.json({ success: true, result });
    }

    if (body?.action === "updateRole") {
      await convex.mutation(rbac.updateRole, {
        sessionToken: session.sessionToken,
        roleId: body.roleId,
        name: body.name ? String(body.name) : undefined,
        description: body.description !== undefined ? String(body.description) : undefined,
        baseRole: body.baseRole ? String(body.baseRole) : undefined,
        color: body.color ? String(body.color) : undefined,
        icon: body.icon ? String(body.icon) : undefined,
        permissions: Array.isArray(body.permissions) ? body.permissions.map(String) : undefined,
        isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      });
      return NextResponse.json({ success: true });
    }

    if (body?.action === "deleteRole") {
      await convex.mutation(rbac.deleteRole, {
        sessionToken: session.sessionToken,
        roleId: body.roleId,
        reassignToRole: body.reassignToRole ? String(body.reassignToRole) : undefined,
      });
      return NextResponse.json({ success: true });
    }

    if (body?.action === "duplicateRole") {
      const result = await convex.mutation(rbac.duplicateRole, {
        sessionToken: session.sessionToken,
        roleId: body.roleId,
        newName: body.newName ? String(body.newName) : undefined,
      });
      return NextResponse.json({ success: true, result });
    }

    if (body?.action === "updateUserRole") {
      await convex.mutation(rbac.updateUserRole, {
        sessionToken: session.sessionToken,
        targetUserId: body.targetUserId,
        newRole: String(body.newRole ?? ""),
        reason: String(body.reason ?? "Developer console RBAC update"),
      });
      return NextResponse.json({ success: true });
    }

    if (body?.action === "updateUserPermissions") {
      await convex.mutation(rbac.updateUserPermissions, {
        sessionToken: session.sessionToken,
        targetUserId: body.targetUserId,
        addedPermissions: Array.isArray(body.addedPermissions) ? body.addedPermissions.map(String) : [],
        removedPermissions: Array.isArray(body.removedPermissions) ? body.removedPermissions.map(String) : [],
        reason: String(body.reason ?? "Developer console permission override"),
      });
      return NextResponse.json({ success: true });
    }

    if (body?.action === "setUserStatus") {
      const mutation = body.status === "active" ? rbac.activatePlatformUser : rbac.suspendPlatformUser;
      await convex.mutation(mutation, {
        sessionToken: session.sessionToken,
        targetUserId: body.targetUserId,
        reason: String(body.reason ?? "Developer console status update"),
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unsupported RBAC action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RBAC operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
