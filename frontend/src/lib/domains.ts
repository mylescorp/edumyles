const DEFAULT_ROOT_DOMAIN = "edumyles.com";

function normalizeDomain(value?: string | null) {
  const domain = (value?.trim() || DEFAULT_ROOT_DOMAIN).replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const bareHost = (domain.split(":")[0] || "").toLowerCase();

  if (
    !bareHost ||
    bareHost === "localhost" ||
    bareHost.endsWith(".localhost") ||
    /^127(?:\.\d{1,3}){3}$/.test(bareHost) ||
    /^0(?:\.\d{1,3}){3}$/.test(bareHost)
  ) {
    return DEFAULT_ROOT_DOMAIN;
  }

  return domain;
}

export function getRootDomain() {
  return normalizeDomain(process.env.NEXT_PUBLIC_ROOT_DOMAIN);
}

export function formatTenantHostname(subdomain: string) {
  return `${subdomain}.${getRootDomain()}`;
}

