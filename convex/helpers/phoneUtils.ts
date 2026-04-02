/**
 * Phone number normalisation utilities for EduMyles.
 *
 * East Africa supports Kenya (+254), Uganda (+256), Tanzania (+255),
 * Rwanda (+250), Ethiopia (+251), and Ghana (+233).
 * Numbers are always normalised to the full international format WITHOUT
 * the leading '+' so they are safe to pass to Africa's Talking and Safaricom.
 */

const COUNTRY_DIAL_PREFIX: Record<string, string> = {
  KE: "254",
  UG: "256",
  TZ: "255",
  RW: "250",
  ET: "251",
  GH: "233",
  // Accept full country names as well
  KENYA: "254",
  UGANDA: "256",
  TANZANIA: "255",
  RWANDA: "250",
  ETHIOPIA: "251",
  GHANA: "233",
};

/**
 * Normalise a phone number to E.164 format (digits only, no '+').
 *
 * Accepts:
 *  - International format:  "+254712345678" → "254712345678"
 *  - International no plus: "254712345678"  → "254712345678" (unchanged)
 *  - Local format:           "0712345678"   → "<prefix>712345678"
 *  - Short local:            "712345678"    → "<prefix>712345678"
 *
 * @param phone Raw phone number string
 * @param countryCode ISO 3166-1 alpha-2 code ("KE", "UG", …) or full country
 *                    name ("Kenya"). Defaults to "KE" if unrecognised.
 */
export function normalisePhoneNumber(phone: string, countryCode: string): string {
  // Strip all non-digit characters except a leading '+'
  const stripped = phone.trim().replace(/[^\d+]/g, "");

  // Already in full international format with '+'
  if (stripped.startsWith("+")) {
    return stripped.slice(1);
  }

  // Already starts with a known international prefix (e.g. "254...")
  const knownPrefixes = Object.values(COUNTRY_DIAL_PREFIX);
  for (const prefix of knownPrefixes) {
    if (stripped.startsWith(prefix) && stripped.length > prefix.length + 4) {
      return stripped; // Already fully normalised
    }
  }

  // Look up the dial prefix for the given country
  const prefix =
    COUNTRY_DIAL_PREFIX[countryCode.toUpperCase()] ??
    COUNTRY_DIAL_PREFIX["KE"];

  // Strip leading 0 (local trunk prefix) and prepend country prefix
  if (stripped.startsWith("0")) {
    return `${prefix}${stripped.slice(1)}`;
  }

  // No leading 0 — assume it is the local number without trunk prefix
  return `${prefix}${stripped}`;
}
