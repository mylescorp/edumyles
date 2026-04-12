const DEFAULT_APP_HOST = "edumyles-frontend.vercel.app";

function normalizeDomain(value?: string | null) {
  const domain = (value?.trim() || inferRootDomain()).replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const bareHost = (domain.split(":")[0] || "").toLowerCase();

  if (
    !bareHost ||
    bareHost === "localhost" ||
    bareHost.endsWith(".localhost") ||
    /^127(?:\.\d{1,3}){3}$/.test(bareHost) ||
    /^0(?:\.\d{1,3}){3}$/.test(bareHost)
  ) {
    return inferRootDomain();
  }

  return domain;
}

function inferRootDomain() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (appUrl) {
    try {
      const host = new URL(appUrl).host.toLowerCase();
      return host.startsWith("app.") ? host.slice(4) : host;
    } catch {
      return DEFAULT_APP_HOST;
    }
  }

  return DEFAULT_APP_HOST;
}

export function getRootDomain() {
  return normalizeDomain(process.env.NEXT_PUBLIC_ROOT_DOMAIN);
}

export function formatTenantHostname(subdomain: string) {
  return `${subdomain}.${getRootDomain()}`;
}

