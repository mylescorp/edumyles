export type SettingsDraft = {
  general: {
    platformName: string;
    supportEmail: string;
    supportPhone: string;
    address: string;
    timezone: string;
    language: string;
    dateFormat: string;
    numberFormat: string;
    logoUrl: string;
    faviconUrl: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    loginBackgroundUrl: string;
    emailHeaderColor: string;
    emailLogoUrl: string;
  };
  domain: {
    primaryDomain: string;
    wildcardPattern: string;
    canonicalDomain: string;
    customDomainSslStatus: string;
    customDomainSslProvider: string;
  };
  email: {
    resendApiKey: string;
    fromName: string;
    fromEmail: string;
    replyTo: string;
    complianceBcc: string;
    trackingEnabled: boolean;
  };
  sms: {
    africasTalkingApiKey: string;
    senderId: string;
    fallbackSenderId: string;
  };
  push: {
    expoPushToken: string;
  };
  payments: {
    vatRatePct: number;
    invoicePrefix: string;
    numberingFormat: string;
    paymentGracePeriodDays: number;
    mpesaEnvironment: string;
    mpesaShortCode: string;
    mpesaPasskey: string;
    airtelEnvironment: string;
    airtelClientId: string;
    airtelClientSecret: string;
    stripeEnvironment: string;
    stripeSecretKey: string;
    stripeWebhookSecret: string;
    bankTransferInstructions: string;
  };
  security: {
    passwordMinLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    enforceMfaMasterAdmin: boolean;
    enforceMfaSuperAdmin: boolean;
    enforceMfaPlatformManager: boolean;
    enforceMfaBillingAdmin: boolean;
    adminIpWhitelist: string[];
    rateLimitPerMinute: number;
    corsOrigins: string[];
  };
  dataPrivacy: {
    userRetentionDays: number;
    auditRetentionDays: number;
    invoiceRetentionDays: number;
    exportFormat: string;
    cookieConsentEnabled: boolean;
    privacyPolicyUrl: string;
    termsUrl: string;
  };
  integrations: {
    workosClientId: string;
    workosOrganizationSync: boolean;
    sentryDsn: string;
    googleOAuthClientId: string;
    githubOAuthClientId: string;
    slackWebhookUrl: string;
  };
  maintenance: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    bypassIps: string[];
  };
};

export const PLATFORM_TIMEZONES = [
  "Africa/Nairobi",
  "Africa/Kampala",
  "Africa/Dar_es_Salaam",
  "Africa/Johannesburg",
  "UTC",
];

export const PLATFORM_LANGUAGES = ["English", "Swahili", "French"];
export const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
export const NUMBER_FORMATS = ["1,234,567.89", "1 234 567,89", "1.234.567,89"];
export const SSL_STATUSES = ["Pending", "Provisioning", "Active", "Error"];
export const SSL_PROVIDERS = ["Managed", "Cloudflare", "Let's Encrypt", "Custom"];
export const EXPORT_FORMATS = ["json", "csv", "zip"];
export const PAYMENT_ENVIRONMENTS = ["sandbox", "production"];

export const DEFAULT_SETTINGS_DRAFT: SettingsDraft = {
  general: {
    platformName: "EduMyles",
    supportEmail: "support@edumyles.com",
    supportPhone: "+254700000000",
    address: "Nairobi, Kenya",
    timezone: "Africa/Nairobi",
    language: "English",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1,234,567.89",
    logoUrl: "",
    faviconUrl: "",
  },
  branding: {
    primaryColor: "#0F4C2A",
    secondaryColor: "#E6A100",
    loginBackgroundUrl: "",
    emailHeaderColor: "#0F4C2A",
    emailLogoUrl: "",
  },
  domain: {
    primaryDomain: "edumyles.com",
    wildcardPattern: "*.edumyles.com",
    canonicalDomain: "app.edumyles.com",
    customDomainSslStatus: "Active",
    customDomainSslProvider: "Managed",
  },
  email: {
    resendApiKey: "",
    fromName: "EduMyles",
    fromEmail: "no-reply@edumyles.com",
    replyTo: "support@edumyles.com",
    complianceBcc: "",
    trackingEnabled: true,
  },
  sms: {
    africasTalkingApiKey: "",
    senderId: "EDUMYLES",
    fallbackSenderId: "",
  },
  push: {
    expoPushToken: "",
  },
  payments: {
    vatRatePct: 16,
    invoicePrefix: "EM",
    numberingFormat: "EM-{YYYY}-{0001}",
    paymentGracePeriodDays: 7,
    mpesaEnvironment: "sandbox",
    mpesaShortCode: "",
    mpesaPasskey: "",
    airtelEnvironment: "sandbox",
    airtelClientId: "",
    airtelClientSecret: "",
    stripeEnvironment: "sandbox",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    bankTransferInstructions: "",
  },
  security: {
    passwordMinLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    enforceMfaMasterAdmin: true,
    enforceMfaSuperAdmin: true,
    enforceMfaPlatformManager: false,
    enforceMfaBillingAdmin: false,
    adminIpWhitelist: [],
    rateLimitPerMinute: 120,
    corsOrigins: ["https://app.edumyles.com"],
  },
  dataPrivacy: {
    userRetentionDays: 365,
    auditRetentionDays: 3650,
    invoiceRetentionDays: 2555,
    exportFormat: "zip",
    cookieConsentEnabled: true,
    privacyPolicyUrl: "https://edumyles.com/privacy",
    termsUrl: "https://edumyles.com/terms",
  },
  integrations: {
    workosClientId: "",
    workosOrganizationSync: true,
    sentryDsn: "",
    googleOAuthClientId: "",
    githubOAuthClientId: "",
    slackWebhookUrl: "",
  },
  maintenance: {
    maintenanceMode: false,
    maintenanceMessage: "We are performing scheduled maintenance. Please check back shortly.",
    bypassIps: [],
  },
};

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  if (value === "true" || value === "false") return value === "true";
  return fallback;
}

function parseNumber(value: string | undefined, fallback: number) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseString(value: string | undefined, fallback: string) {
  return value ?? fallback;
}

function parseEnumValue(value: string | undefined, allowedValues: string[], fallback: string) {
  if (!value) return fallback;
  return allowedValues.includes(value) ? value : fallback;
}

function parseStringArray(value: string | undefined, fallback: string[]) {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed;
    }
  } catch {
    const lineSplit = value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (lineSplit.length > 0) {
      return lineSplit;
    }
  }

  return fallback;
}

export function serializeSettingValue(value: unknown) {
  if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    return JSON.stringify(value);
  }

  return String(value ?? "");
}

export function getSectionEntries<K extends keyof SettingsDraft>(
  draft: SettingsDraft,
  section: K
): Array<{ key: string; value: string }> {
  return Object.entries(draft[section]).map(([key, value]) => ({
    key: `${String(section)}.${key}`,
    value: serializeSettingValue(value),
  }));
}

export function applyDbSettings(
  draft: SettingsDraft,
  dbSettings: Record<string, Record<string, string>>
): SettingsDraft {
  const result: SettingsDraft = structuredClone(draft);

  const general = dbSettings.general ?? {};
  result.general = {
    platformName: parseString(general.platformName, draft.general.platformName),
    supportEmail: parseString(general.supportEmail, draft.general.supportEmail),
    supportPhone: parseString(general.supportPhone, draft.general.supportPhone),
    address: parseString(general.address, draft.general.address),
    timezone: parseEnumValue(general.timezone, PLATFORM_TIMEZONES, draft.general.timezone),
    language: parseEnumValue(general.language, PLATFORM_LANGUAGES, draft.general.language),
    dateFormat: parseEnumValue(general.dateFormat, DATE_FORMATS, draft.general.dateFormat),
    numberFormat: parseEnumValue(general.numberFormat, NUMBER_FORMATS, draft.general.numberFormat),
    logoUrl: parseString(general.logoUrl, draft.general.logoUrl),
    faviconUrl: parseString(general.faviconUrl, draft.general.faviconUrl),
  };

  const branding = dbSettings.branding ?? {};
  result.branding = {
    primaryColor: parseString(branding.primaryColor, draft.branding.primaryColor),
    secondaryColor: parseString(branding.secondaryColor, draft.branding.secondaryColor),
    loginBackgroundUrl: parseString(branding.loginBackgroundUrl, draft.branding.loginBackgroundUrl),
    emailHeaderColor: parseString(branding.emailHeaderColor, draft.branding.emailHeaderColor),
    emailLogoUrl: parseString(branding.emailLogoUrl, draft.branding.emailLogoUrl),
  };

  const domain = dbSettings.domain ?? {};
  result.domain = {
    primaryDomain: parseString(domain.primaryDomain, draft.domain.primaryDomain),
    wildcardPattern: parseString(domain.wildcardPattern, draft.domain.wildcardPattern),
    canonicalDomain: parseString(domain.canonicalDomain, draft.domain.canonicalDomain),
    customDomainSslStatus: parseEnumValue(
      domain.customDomainSslStatus,
      SSL_STATUSES,
      draft.domain.customDomainSslStatus
    ),
    customDomainSslProvider: parseEnumValue(
      domain.customDomainSslProvider,
      SSL_PROVIDERS,
      draft.domain.customDomainSslProvider
    ),
  };

  const email = dbSettings.email ?? {};
  result.email = {
    resendApiKey: parseString(email.resendApiKey, draft.email.resendApiKey),
    fromName: parseString(email.fromName, draft.email.fromName),
    fromEmail: parseString(email.fromEmail, draft.email.fromEmail),
    replyTo: parseString(email.replyTo, draft.email.replyTo),
    complianceBcc: parseString(email.complianceBcc, draft.email.complianceBcc),
    trackingEnabled: parseBoolean(email.trackingEnabled, draft.email.trackingEnabled),
  };

  const sms = dbSettings.sms ?? {};
  result.sms = {
    africasTalkingApiKey: parseString(sms.africasTalkingApiKey, draft.sms.africasTalkingApiKey),
    senderId: parseString(sms.senderId, draft.sms.senderId),
    fallbackSenderId: parseString(sms.fallbackSenderId, draft.sms.fallbackSenderId),
  };

  const push = dbSettings.push ?? {};
  result.push = {
    expoPushToken: parseString(push.expoPushToken, draft.push.expoPushToken),
  };

  const payments = dbSettings.payments ?? {};
  result.payments = {
    vatRatePct: parseNumber(payments.vatRatePct, draft.payments.vatRatePct),
    invoicePrefix: parseString(payments.invoicePrefix, draft.payments.invoicePrefix),
    numberingFormat: parseString(payments.numberingFormat, draft.payments.numberingFormat),
    paymentGracePeriodDays: parseNumber(
      payments.paymentGracePeriodDays,
      draft.payments.paymentGracePeriodDays
    ),
    mpesaEnvironment: parseEnumValue(
      payments.mpesaEnvironment,
      PAYMENT_ENVIRONMENTS,
      draft.payments.mpesaEnvironment
    ),
    mpesaShortCode: parseString(payments.mpesaShortCode, draft.payments.mpesaShortCode),
    mpesaPasskey: parseString(payments.mpesaPasskey, draft.payments.mpesaPasskey),
    airtelEnvironment: parseEnumValue(
      payments.airtelEnvironment,
      PAYMENT_ENVIRONMENTS,
      draft.payments.airtelEnvironment
    ),
    airtelClientId: parseString(payments.airtelClientId, draft.payments.airtelClientId),
    airtelClientSecret: parseString(
      payments.airtelClientSecret,
      draft.payments.airtelClientSecret
    ),
    stripeEnvironment: parseEnumValue(
      payments.stripeEnvironment,
      PAYMENT_ENVIRONMENTS,
      draft.payments.stripeEnvironment
    ),
    stripeSecretKey: parseString(payments.stripeSecretKey, draft.payments.stripeSecretKey),
    stripeWebhookSecret: parseString(
      payments.stripeWebhookSecret,
      draft.payments.stripeWebhookSecret
    ),
    bankTransferInstructions: parseString(
      payments.bankTransferInstructions,
      draft.payments.bankTransferInstructions
    ),
  };

  const security = dbSettings.security ?? {};
  result.security = {
    passwordMinLength: parseNumber(security.passwordMinLength, draft.security.passwordMinLength),
    requireUppercase: parseBoolean(security.requireUppercase, draft.security.requireUppercase),
    requireLowercase: parseBoolean(security.requireLowercase, draft.security.requireLowercase),
    requireNumbers: parseBoolean(security.requireNumbers, draft.security.requireNumbers),
    requireSpecialChars: parseBoolean(
      security.requireSpecialChars,
      draft.security.requireSpecialChars
    ),
    sessionTimeoutMinutes: parseNumber(
      security.sessionTimeoutMinutes,
      draft.security.sessionTimeoutMinutes
    ),
    maxLoginAttempts: parseNumber(
      security.maxLoginAttempts,
      draft.security.maxLoginAttempts
    ),
    lockoutDurationMinutes: parseNumber(
      security.lockoutDurationMinutes,
      draft.security.lockoutDurationMinutes
    ),
    enforceMfaMasterAdmin: parseBoolean(
      security.enforceMfaMasterAdmin,
      draft.security.enforceMfaMasterAdmin
    ),
    enforceMfaSuperAdmin: parseBoolean(
      security.enforceMfaSuperAdmin,
      draft.security.enforceMfaSuperAdmin
    ),
    enforceMfaPlatformManager: parseBoolean(
      security.enforceMfaPlatformManager,
      draft.security.enforceMfaPlatformManager
    ),
    enforceMfaBillingAdmin: parseBoolean(
      security.enforceMfaBillingAdmin,
      draft.security.enforceMfaBillingAdmin
    ),
    adminIpWhitelist: parseStringArray(
      security.adminIpWhitelist,
      draft.security.adminIpWhitelist
    ),
    rateLimitPerMinute: parseNumber(
      security.rateLimitPerMinute,
      draft.security.rateLimitPerMinute
    ),
    corsOrigins: parseStringArray(security.corsOrigins, draft.security.corsOrigins),
  };

  const dataPrivacy = dbSettings.dataPrivacy ?? {};
  result.dataPrivacy = {
    userRetentionDays: parseNumber(dataPrivacy.userRetentionDays, draft.dataPrivacy.userRetentionDays),
    auditRetentionDays: parseNumber(
      dataPrivacy.auditRetentionDays,
      draft.dataPrivacy.auditRetentionDays
    ),
    invoiceRetentionDays: parseNumber(
      dataPrivacy.invoiceRetentionDays,
      draft.dataPrivacy.invoiceRetentionDays
    ),
    exportFormat: parseEnumValue(
      dataPrivacy.exportFormat,
      EXPORT_FORMATS,
      draft.dataPrivacy.exportFormat
    ),
    cookieConsentEnabled: parseBoolean(
      dataPrivacy.cookieConsentEnabled,
      draft.dataPrivacy.cookieConsentEnabled
    ),
    privacyPolicyUrl: parseString(
      dataPrivacy.privacyPolicyUrl,
      draft.dataPrivacy.privacyPolicyUrl
    ),
    termsUrl: parseString(dataPrivacy.termsUrl, draft.dataPrivacy.termsUrl),
  };

  const integrations = dbSettings.integrations ?? {};
  result.integrations = {
    workosClientId: parseString(integrations.workosClientId, draft.integrations.workosClientId),
    workosOrganizationSync: parseBoolean(
      integrations.workosOrganizationSync,
      draft.integrations.workosOrganizationSync
    ),
    sentryDsn: parseString(integrations.sentryDsn, draft.integrations.sentryDsn),
    googleOAuthClientId: parseString(
      integrations.googleOAuthClientId,
      draft.integrations.googleOAuthClientId
    ),
    githubOAuthClientId: parseString(
      integrations.githubOAuthClientId,
      draft.integrations.githubOAuthClientId
    ),
    slackWebhookUrl: parseString(
      integrations.slackWebhookUrl,
      draft.integrations.slackWebhookUrl
    ),
  };

  const maintenance = dbSettings.maintenance ?? {};
  result.maintenance = {
    maintenanceMode: parseBoolean(
      maintenance.maintenanceMode,
      draft.maintenance.maintenanceMode
    ),
    maintenanceMessage: parseString(
      maintenance.maintenanceMessage,
      draft.maintenance.maintenanceMessage
    ),
    bypassIps: parseStringArray(maintenance.bypassIps, draft.maintenance.bypassIps),
  };

  return result;
}
