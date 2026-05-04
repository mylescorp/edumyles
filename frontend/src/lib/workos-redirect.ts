import { NextRequest } from "next/server";

const DEFAULT_APP_URL = "https://app.edumyles.com";

function normalizeUrl(value?: string | null) {
  return value?.trim().replace(/\/+$/, "");
}

export function getCanonicalAppUrl() {
  return normalizeUrl(process.env.NEXT_PUBLIC_APP_URL) ?? DEFAULT_APP_URL;
}

export function getCanonicalWorkOSRedirectUri() {
  const canonical = `${getCanonicalAppUrl()}/auth/callback`;
  const configured =
    normalizeUrl(process.env.WORKOS_REDIRECT_URI) ??
    normalizeUrl(process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI);

  if (!configured) {
    return canonical;
  }

  try {
    const configuredUrl = new URL(configured);
    const canonicalUrl = new URL(canonical);
    if (configuredUrl.host === canonicalUrl.host && configuredUrl.pathname === "/auth/callback") {
      return configured;
    }
  } catch {
    // Fall through to the canonical app callback.
  }

  return canonical;
}

export function resolveWorkOSRedirectUri(req: NextRequest) {
  const currentHost = req.nextUrl.hostname.toLowerCase();
  const isLocalhost =
    currentHost === "localhost" ||
    currentHost === "127.0.0.1" ||
    currentHost.endsWith(".localhost");

  if (isLocalhost && process.env.NODE_ENV !== "production") {
    return `${req.nextUrl.origin}/auth/callback`;
  }

  return getCanonicalWorkOSRedirectUri();
}
