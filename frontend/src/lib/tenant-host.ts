import { getRootDomain } from "@/lib/domains";

const RESERVED_SUBDOMAINS = new Set([
  "",
  "app",
  "www",
  "api",
  "auth",
  "mail",
  "email",
  "support",
  "help",
  "status",
  "cdn",
  "static",
  "assets",
  "blog",
]);

export function getBareHost(host?: string | null) {
  return (host ?? "").split(":")[0]?.trim().toLowerCase() ?? "";
}

export function getTenantSubdomainFromHost(host?: string | null) {
  const bareHost = getBareHost(host);
  const rootDomain = getRootDomain().toLowerCase();

  if (
    !bareHost ||
    bareHost === "localhost" ||
    bareHost.endsWith(".localhost") ||
    /^127(?:\.\d{1,3}){3}$/.test(bareHost)
  ) {
    return null;
  }

  if (!bareHost.endsWith(`.${rootDomain}`)) {
    return null;
  }

  const subdomain = bareHost.slice(0, -rootDomain.length - 1).split(".")[0] ?? "";
  return RESERVED_SUBDOMAINS.has(subdomain) ? null : subdomain;
}

export function getTenantHostFromRequestHost(host?: string | null) {
  const bareHost = getBareHost(host);
  return getTenantSubdomainFromHost(bareHost) ? bareHost : null;
}

export function getTenantOriginFromHost(host?: string | null) {
  const tenantHost = getTenantHostFromRequestHost(host);
  return tenantHost ? `https://${tenantHost}` : null;
}

export function getSharedCookieDomain(host?: string | null) {
  const bareHost = getBareHost(host);
  const rootDomain = getRootDomain().toLowerCase();

  if (!rootDomain.includes(".") || !bareHost.endsWith(rootDomain)) {
    return undefined;
  }

  return `.${rootDomain}`;
}
