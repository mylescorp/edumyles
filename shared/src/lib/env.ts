export function readFirstEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}

function parseEmailAddress(value: string | undefined): { email?: string; name?: string } {
  if (!value) return {};

  const match = value.match(/^\s*(?:"?([^"<]*)"?\s*)?<([^<>@\s]+@[^<>@\s]+)>\s*$/);
  if (match) {
    return {
      email: match[2]?.trim(),
      name: match[1]?.trim() || undefined,
    };
  }

  return { email: value.trim() };
}

export function resolveMpesaConfig() {
  return {
    consumerKey: readFirstEnv("MPESA_CONSUMER_KEY", "CONVEX_MPESA_CONSUMER_KEY"),
    consumerSecret: readFirstEnv("MPESA_CONSUMER_SECRET", "CONVEX_MPESA_CONSUMER_SECRET"),
    shortcode: readFirstEnv("MPESA_SHORTCODE", "CONVEX_MPESA_SHORTCODE"),
    passkey: readFirstEnv("MPESA_PASSKEY", "CONVEX_MPESA_PASSKEY"),
    callbackUrl: readFirstEnv("MPESA_CALLBACK_URL", "CONVEX_MPESA_CALLBACK_URL"),
    environment: readFirstEnv("MPESA_ENVIRONMENT") ?? "sandbox",
  };
}

export function resolveAirtelConfig() {
  return {
    clientId: readFirstEnv("AIRTEL_CLIENT_ID", "CONVEX_AIRTEL_CLIENT_ID"),
    clientSecret: readFirstEnv("AIRTEL_CLIENT_SECRET", "CONVEX_AIRTEL_CLIENT_SECRET"),
    partyId: readFirstEnv("AIRTEL_PARTY_ID", "CONVEX_AIRTEL_PARTY_ID"),
    callbackUrl: readFirstEnv("AIRTEL_CALLBACK_URL", "CONVEX_AIRTEL_CALLBACK_URL"),
    environment: readFirstEnv("AIRTEL_ENVIRONMENT") ?? "staging",
  };
}

export function resolveResendConfig() {
  const from = parseEmailAddress(readFirstEnv("RESEND_FROM_EMAIL"));
  return {
    apiKey: readFirstEnv("RESEND_API_KEY"),
    fromEmail: from.email,
    fromName: readFirstEnv("RESEND_FROM_NAME") ?? from.name ?? "EduMyles",
  };
}

export function resolveAfricasTalkingConfig() {
  return {
    username: readFirstEnv("AT_USERNAME", "AFRICAS_TALKING_USERNAME"),
    apiKey: readFirstEnv("AT_API_KEY", "AFRICAS_TALKING_API_KEY"),
    senderId: readFirstEnv("AT_SENDER_ID", "AFRICAS_TALKING_SENDER_ID"),
    environment: readFirstEnv("AT_ENVIRONMENT") ?? "sandbox",
  };
}
