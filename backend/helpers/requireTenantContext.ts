import { GenericQueryCtx, GenericMutationCtx, GenericDataModel } from "convex/server";

type QueryCtx = GenericQueryCtx<GenericDataModel>;
type MutationCtx = GenericMutationCtx<GenericDataModel>;

export type TenantContext = {
  tenantId: string;
  userId: string;
  role: string;
  permissions: string[];
};

export async function requireTenantContext(ctx: QueryCtx | MutationCtx, token: string): Promise<TenantContext> {
  if (!token) throw new Error("UNAUTHORIZED: No session token provided");
  const session = await ctx.db.query("sessions").withIndex("by_token", (q: any) => q.eq("token", token)).unique() as any;
  if (!session) throw new Error("UNAUTHORIZED: Session not found");
  if ((session.expiresAt as number) < Date.now()) throw new Error("UNAUTHORIZED: Session expired");
  const user = await ctx.db.query("users").withIndex("by_tenant", (q: any) => q.eq("tenantId", session.tenantId)).filter((q: any) => q.eq(q.field("_id"), session.userId)).unique() as any;
  if (!user) throw new Error("UNAUTHORIZED: User not found");
  if (!user.isActive) throw new Error("FORBIDDEN: User account is inactive");
  return {
    tenantId: session.tenantId as string,
    userId: session.userId as string,
    role: session.role as string,
    permissions: (session.permissions ?? []) as string[],
  };
}

export function requireRole(tenantCtx: TenantContext, allowedRoles: string[]): void {
  if (!allowedRoles.includes(tenantCtx.role)) throw new Error(`FORBIDDEN: Role '${tenantCtx.role}' not allowed. Required: ${allowedRoles.join(", ")}`);
}

export function requirePermission(tenantCtx: TenantContext, permission: string): void {
  if (!tenantCtx.permissions.includes(permission)) throw new Error(`FORBIDDEN: Missing permission '${permission}'`);
}
