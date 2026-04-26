import { v } from "convex/values";

export const marketingAttributionValidator = v.object({
  utmSource: v.optional(v.string()),
  utmMedium: v.optional(v.string()),
  utmCampaign: v.optional(v.string()),
  utmTerm: v.optional(v.string()),
  utmContent: v.optional(v.string()),
  gclid: v.optional(v.string()),
  fbclid: v.optional(v.string()),
  msclkid: v.optional(v.string()),
  ttclid: v.optional(v.string()),
  referrer: v.optional(v.string()),
  landingPage: v.optional(v.string()),
  currentPage: v.optional(v.string()),
  originPath: v.optional(v.string()),
  ctaSource: v.optional(v.string()),
  ctaLabel: v.optional(v.string()),
  referralClickId: v.optional(v.string()),
});

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

function clean(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function normalizeMarketingAttribution(
  value?: MarketingAttribution | null
): MarketingAttribution | undefined {
  if (!value) return undefined;

  const normalized: MarketingAttribution = {
    utmSource: clean(value.utmSource),
    utmMedium: clean(value.utmMedium),
    utmCampaign: clean(value.utmCampaign),
    utmTerm: clean(value.utmTerm),
    utmContent: clean(value.utmContent),
    gclid: clean(value.gclid),
    fbclid: clean(value.fbclid),
    msclkid: clean(value.msclkid),
    ttclid: clean(value.ttclid),
    referrer: clean(value.referrer),
    landingPage: clean(value.landingPage),
    currentPage: clean(value.currentPage),
    originPath: clean(value.originPath),
    ctaSource: clean(value.ctaSource),
    ctaLabel: clean(value.ctaLabel),
    referralClickId: clean(value.referralClickId),
  };

  return Object.values(normalized).some(Boolean) ? normalized : undefined;
}

export function mergeMarketingAttribution(
  current?: MarketingAttribution | null,
  incoming?: MarketingAttribution | null
): MarketingAttribution | undefined {
  const normalizedCurrent = normalizeMarketingAttribution(current);
  const normalizedIncoming = normalizeMarketingAttribution(incoming);

  if (!normalizedCurrent && !normalizedIncoming) return undefined;

  return {
    ...normalizedCurrent,
    ...normalizedIncoming,
    landingPage: normalizedCurrent?.landingPage ?? normalizedIncoming?.landingPage,
    originPath: normalizedIncoming?.originPath ?? normalizedCurrent?.originPath,
    referralClickId:
      normalizedIncoming?.referralClickId ?? normalizedCurrent?.referralClickId,
  };
}

export function formatAttributionSummary(value?: MarketingAttribution | null) {
  const attribution = normalizeMarketingAttribution(value);
  if (!attribution) return [];

  return [
    attribution.ctaSource ? `CTA: ${attribution.ctaSource}` : undefined,
    attribution.ctaLabel ? `CTA label: ${attribution.ctaLabel}` : undefined,
    attribution.utmSource ? `UTM source: ${attribution.utmSource}` : undefined,
    attribution.utmMedium ? `UTM medium: ${attribution.utmMedium}` : undefined,
    attribution.utmCampaign ? `UTM campaign: ${attribution.utmCampaign}` : undefined,
    attribution.utmTerm ? `UTM term: ${attribution.utmTerm}` : undefined,
    attribution.utmContent ? `UTM content: ${attribution.utmContent}` : undefined,
    attribution.gclid ? `GCLID: ${attribution.gclid}` : undefined,
    attribution.fbclid ? `FBCLID: ${attribution.fbclid}` : undefined,
    attribution.msclkid ? `MSCLKID: ${attribution.msclkid}` : undefined,
    attribution.ttclid ? `TTCLID: ${attribution.ttclid}` : undefined,
    attribution.landingPage ? `Landing page: ${attribution.landingPage}` : undefined,
    attribution.currentPage ? `Conversion page: ${attribution.currentPage}` : undefined,
    attribution.originPath ? `CTA origin: ${attribution.originPath}` : undefined,
    attribution.referrer ? `Referrer: ${attribution.referrer}` : undefined,
    attribution.referralClickId
      ? `Referral click: ${attribution.referralClickId}`
      : undefined,
  ].filter((item): item is string => Boolean(item));
}
