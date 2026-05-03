const DEFAULT_MARKETING_SITE_URL = "https://edumyles.com";
const LOCAL_MARKETING_PORT = "3001";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getMarketingSiteUrl(origin?: string) {
  const configuredLandingUrl = process.env.NEXT_PUBLIC_LANDING_URL?.trim();
  if (configuredLandingUrl) {
    return trimTrailingSlash(configuredLandingUrl);
  }

  const configuredUrl = process.env.NEXT_PUBLIC_MARKETING_SITE_URL?.trim();
  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl);
  }

  if (origin) {
    const currentUrl = new URL(origin);
    if (
      currentUrl.hostname === "localhost" ||
      currentUrl.hostname === "127.0.0.1"
    ) {
      return `${currentUrl.protocol}//${currentUrl.hostname}:${LOCAL_MARKETING_PORT}`;
    }
  }

  return DEFAULT_MARKETING_SITE_URL;
}

export function getMarketingSitePath(path: string, origin?: string) {
  const baseUrl = getMarketingSiteUrl(origin);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
