export type UserType = "STU" | "TCH" | "PAR" | "ADM" | "STF";

export function generateTenantId(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return `TENANT-${code}`;
}

export function generateUserId(
  tenantId: string,
  userType: UserType,
  sequential: number
): string {
  const tenantCode = tenantId.replace("TENANT-", "");
  const padded = sequential.toString().padStart(6, "0");
  return `${tenantCode}-${userType}-${padded}`;
}

export function validateTenantId(tenantId: string): boolean {
  return /^TENANT-\d{6}$/.test(tenantId);
}

export function validateUserId(userId: string): boolean {
  return /^\d{6}-(STU|TCH|PAR|ADM|STF)-\d{6}$/.test(userId);
}

export function parseTenantId(userId: string): string {
  const parts = userId.split("-");
  return `TENANT-${parts[0]}`;
}
