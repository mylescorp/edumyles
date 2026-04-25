export type MarketingAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  referrer?: string;
  landingPage?: string;
  currentPage?: string;
  originPath?: string;
  ctaSource?: string;
  ctaLabel?: string;
  referralClickId?: string;
};

type SearchParamReader = {
  get(name: string): string | null;
};

const STORAGE_KEY = "edumyles_marketing_attribution_v1";

const ATTR_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "msclkid",
  "ttclid",
] as const;

function clean(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function readStoredAttribution(): MarketingAttribution | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as MarketingAttribution;
  } catch {
    return undefined;
  }
}

export function writeStoredAttribution(value: MarketingAttribution | undefined) {
  if (typeof window === "undefined" || !value) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
}

export function extractAttributionFromSearchParams(
  searchParams: SearchParamReader,
  pathname: string
): MarketingAttribution {
  const attribution: MarketingAttribution = {
    utmSource: clean(searchParams.get("utm_source")),
    utmMedium: clean(searchParams.get("utm_medium")),
    utmCampaign: clean(searchParams.get("utm_campaign")),
    utmTerm: clean(searchParams.get("utm_term")),
    utmContent: clean(searchParams.get("utm_content")),
    gclid: clean(searchParams.get("gclid")),
    fbclid: clean(searchParams.get("fbclid")),
    msclkid: clean(searchParams.get("msclkid")),
    ttclid: clean(searchParams.get("ttclid")),
    referrer: typeof document !== "undefined" ? clean(document.referrer) : undefined,
    landingPage: pathname,
    currentPage: pathname,
    originPath: clean(searchParams.get("origin")),
    ctaSource: clean(searchParams.get("cta")),
    ctaLabel: clean(searchParams.get("cta_label")),
    referralClickId: clean(searchParams.get("ref_click_id")),
  };

  return attribution;
}

export function mergeAttribution(
  existing?: MarketingAttribution,
  incoming?: MarketingAttribution
): MarketingAttribution | undefined {
  const merged = {
    ...existing,
    ...incoming,
    landingPage: existing?.landingPage ?? incoming?.landingPage,
    referrer: existing?.referrer ?? incoming?.referrer,
    referralClickId: incoming?.referralClickId ?? existing?.referralClickId,
  };

  return Object.values(merged).some(Boolean) ? merged : undefined;
}

export function persistAttributionFromSearchParams(
  searchParams: SearchParamReader,
  pathname: string
) {
  const hasTrackedParam = ATTR_KEYS.some((key) => Boolean(searchParams.get(key)));
  const hasCtaMeta =
    Boolean(searchParams.get("cta")) ||
    Boolean(searchParams.get("cta_label")) ||
    Boolean(searchParams.get("ref_click_id"));

  if (!hasTrackedParam && !hasCtaMeta && typeof document !== "undefined" && !document.referrer) {
    return;
  }

  const current = readStoredAttribution();
  const incoming = extractAttributionFromSearchParams(searchParams, pathname);
  const merged = mergeAttribution(current, incoming);
  if (merged) writeStoredAttribution(merged);
}

export function buildSubmissionAttribution(
  searchParams: SearchParamReader,
  pathname: string,
  overrides?: Partial<MarketingAttribution>
) {
  const stored = readStoredAttribution();
  const current = extractAttributionFromSearchParams(searchParams, pathname);
  return mergeAttribution(mergeAttribution(stored, current), overrides);
}

export function storeReferralClickId(clickId: string) {
  const current = readStoredAttribution();
  const merged = mergeAttribution(current, { referralClickId: clickId });
  if (merged) writeStoredAttribution(merged);
}
