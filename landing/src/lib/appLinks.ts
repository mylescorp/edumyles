export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://app.edumyles.com";
}

export function getAppHref(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const appBaseUrl = getAppBaseUrl();

  if (appBaseUrl) {
    return `${appBaseUrl}${normalizedPath}`;
  }

  return `/auth/login/api?returnTo=${encodeURIComponent(normalizedPath)}`;
}
