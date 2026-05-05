export const CALCOM_ORIGIN = process.env.NEXT_PUBLIC_CALCOM_ORIGIN ?? "https://cal.com";
export const CALCOM_EMBED_ORIGIN =
  process.env.NEXT_PUBLIC_CALCOM_EMBED_ORIGIN ?? "https://app.cal.com";

export const CAL_CONFIG = {
  calLink: process.env.NEXT_PUBLIC_CALCOM_DEMO_LINK ?? "edumyles/demo",
  namespace: process.env.NEXT_PUBLIC_CALCOM_DEMO_NAMESPACE ?? "edumyles-demo",
  config: {
    layout: "month_view" as const,
    theme: "light" as const,
  },
} as const;

type CalBookingUrlFields = {
  name?: string;
  email?: string;
  phone?: string;
  demoRequestId?: string;
  schoolName?: string;
  source?: string;
};

export function buildCalBookingUrl(fields: CalBookingUrlFields = {}) {
  const url = new URL(`/${CAL_CONFIG.calLink}`, CALCOM_ORIGIN);

  if (fields.name) url.searchParams.set("name", fields.name);
  if (fields.email) url.searchParams.set("email", fields.email);
  if (fields.phone) url.searchParams.set("phone", fields.phone);
  if (fields.demoRequestId) url.searchParams.set("metadata[demoRequestId]", fields.demoRequestId);
  if (fields.schoolName) url.searchParams.set("metadata[schoolName]", fields.schoolName);
  if (fields.source) url.searchParams.set("metadata[source]", fields.source);

  return url.toString();
}
