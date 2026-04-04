const DEFAULT_ROOT_DOMAIN = "edumyles.com";

function normalizeDomain(value?: string | null) {
  const domain = value?.trim() || DEFAULT_ROOT_DOMAIN;
  return domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

export function getRootDomain() {
  return normalizeDomain(process.env.NEXT_PUBLIC_ROOT_DOMAIN);
}

export function formatTenantHostname(subdomain: string) {
  return `${subdomain}.${getRootDomain()}`;
}

