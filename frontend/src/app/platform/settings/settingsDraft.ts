export type SenderIdRow = {
  country: string;
  senderId: string;
  status: string;
};

export type RoleRedirectRow = {
  role: string;
  path: string;
};

export type MaintenanceComponent =
  | "web_app"
  | "mobile_app"
  | "api"
  | "payment_processing"
  | "email"
  | "sms";

export type SettingsDraft = {
  general: {
    platformName: string;
    platformTagline: string;
    logoLightUrl: string;
    logoDarkUrl: string;
    faviconUrl: string;
    supportEmail: string;
    supportPhone: string;
    physicalAddress: string;
    companyRegistrationNumber: string;
    vatRegistrationNumber: string;
    timezone: string;
    language: string;
    dateFormat: string;
    numberFormat: string;
    currencyDisplay: string;
    weekStartsOn: string;
    announcementEnabled: boolean;
    announcementMessage: string;
    announcementType: string;
    announcementDismissible: boolean;
    announcementExpiryAt: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    dangerColor: string;
    successColor: string;
    loginLayout: string;
    loginBackgroundType: string;
    loginBackgroundColor: string;
    loginBackgroundColor2: string;
    loginBackgroundImageUrl: string;
    loginShowLogo: boolean;
    loginShowTagline: boolean;
    loginCardStyle: string;
    emailHeaderLogoUrl: string;
    emailHeaderBackgroundColor: string;
    emailHeaderTextColor: string;
    emailFooterText: string;
    emailFooterBackgroundColor: string;
    emailAccentColor: string;
    smsSenderName: string;
    smsSenderApprovalStatus: string;
    smsFooterText: string;
    portalTheme: string;
    allowTenantBrandOverride: boolean;
    defaultPortalPrimaryColor: string;
  };
  domain: {
    primaryDomain: string;
    platformAdminUrl: string;
    apiBaseUrl: string;
    subdomainPattern: string;
    subdomainCharacterRules: string;
    reservedSubdomains: string[];
    autoGenerateSubdomain: boolean;
    subdomainCollisionHandling: string;
    customDomainsEnabled: boolean;
    sslProvider: string;
    sslAutoRenew: boolean;
    maxCustomDomainsPerTenant: number;
    customDomainVerificationMethod: string;
    forceCanonicalDomain: boolean;
    httpsEnforced: boolean;
    hstsEnabled: boolean;
    maintenanceRedirectUrl: string;
    notFoundRedirectUrl: string;
    loginRedirectUrl: string;
    postLoginRedirects: RoleRedirectRow[];
    developerPortalUrl: string;
    resellerPortalUrl: string;
    affiliatePortalUrl: string;
    developerApplyUrl: string;
    resellerApplyUrl: string;
  };
  email: {
    provider: string;
    resendApiKey: string;
    fromName: string;
    fromEmail: string;
    replyToEmail: string;
    bccEmail: string;
    bounceHandlingEmail: string;
    dailySendLimit: string;
    rateLimitPerSecond: string;
    openTrackingEnabled: boolean;
    clickTrackingEnabled: boolean;
    unsubscribeAlwaysInclude: boolean;
    sendingDomain: string;
    spfStatus: string;
    dkimStatus: string;
    dmarcStatus: string;
    dnsRecords: string;
    dnsLastVerifiedAt: string;
  };
  sms: {
    provider: string;
    apiKey: string;
    username: string;
    defaultSenderId: string;
    defaultSenderApprovalStatus: string;
    fallbackSenderId: string;
    countrySenderIds: SenderIdRow[];
    unicodeSupport: boolean;
    optOutFooterEnabled: boolean;
    optOutFooterText: string;
    monthlyQuota: string;
    smsUsedThisMonth: number;
    totalCostThisMonthKes: number;
  };
  push: {
    provider: string;
    expoAccessToken: string;
    notificationIconUrl: string;
    notificationColor: string;
    notificationSound: string;
    badgeCountMode: string;
    deliveryPriority: string;
    ttlSeconds: number;
    notificationExpiryDays: number;
  };
  payments: {
    vatRatePct: number;
    paymentGracePeriodDays: number;
    autoRetryFailedPayments: boolean;
    retryFrequencyDays: number;
    maxRetriesBeforeSuspension: number;
    baseCurrency: string;
    invoiceNumberPrefix: string;
    invoiceNumberStart: number;
    invoiceFooterText: string;
    invoiceLogoUrl: string;
    mpesaEnvironment: string;
    mpesaConsumerKey: string;
    mpesaConsumerSecret: string;
    mpesaShortCode: string;
    mpesaPasskey: string;
    mpesaInitiatorName: string;
    mpesaSecurityCredential: string;
    airtelEnvironment: string;
    airtelClientId: string;
    airtelClientSecret: string;
    airtelMerchantId: string;
    stripeEnvironment: string;
    stripePublishableKey: string;
    stripeSecretKey: string;
    stripeWebhookSecret: string;
    stripePaymentMethods: string[];
    bankName: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankBranchCode: string;
    bankSwiftCode: string;
    bankIban: string;
    bankReferenceInstruction: string;
    bankInstructions: string;
    bankManualVerification: boolean;
  };
  security: {
    passwordMinLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumber: boolean;
    requireSpecialCharacter: boolean;
    passwordExpiryDays: number;
    passwordHistoryCount: number;
    breachCheckEnabled: boolean;
    sessionTimeoutMinutes: number;
    absoluteSessionTimeoutHours: number;
    concurrentSessionsPerUser: number;
    rememberMeDurationDays: number;
    revokeSessionsOnPasswordChange: boolean;
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    progressiveLockout: boolean;
    showLockoutReason: boolean;
    emailOnNewDeviceLogin: boolean;
    emailOnFailedLogin: boolean;
    allowedDomains: string[];
    ipAllowlist: string[];
    geoBlockingMode: string;
    allowedCountries: string[];
    mfaMasterAdmin: string;
    mfaSuperAdmin: string;
    mfaOtherRoles: string;
    mfaGracePeriodDays: number;
    apiRateLimitPerIp: number;
    apiRateLimitPerUser: number;
    corsAllowedOrigins: string[];
    contentSecurityPolicy: string;
    hstsMaxAge: number;
    securityNotifyEvents: string[];
    securityNotifyChannels: string[];
  };
  dataPrivacy: {
    auditLogsRetentionDays: number;
    sessionLogsRetentionDays: number;
    deletedTenantDataRetentionDays: number;
    cancelledSubscriptionRetentionDays: number;
    smsLogsRetentionDays: number;
    emailLogsRetentionDays: number;
    analyticsEventsRetentionDays: number;
    dataExportFormat: string;
    autoProcessExportRequests: boolean;
    exportDeliveryMethod: string;
    exportLinkExpiryHours: number;
    dataProcessingRegisterUrl: string;
    cookieConsentEnabled: boolean;
    consentMode: string;
    analyticsConsentRequired: boolean;
    cookiePolicyUrl: string;
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
    dataProcessingAgreementUrl: string;
    forceReacceptOnPolicyUpdate: boolean;
    dataResidencyRegion: string;
  };
  integrations: {
    paymentGateway: string;
    smsProvider: string;
    analyticsEnabled: boolean;
    workosApiKey: string;
    workosClientId: string;
    workosEnvironment: string;
    workosOrganizationId: string;
    workosCallbackUrl: string;
    enabledAuthMethods: string[];
    sentryDsn: string;
    sentryEnvironment: string;
    sentrySampleRate: number;
    sentryEnableFrontend: boolean;
    sentryEnableBackend: boolean;
    slackWebhookUrl: string;
    slackChannel: string;
    slackEvents: string[];
    googleAnalyticsMeasurementId: string;
    analyticsScope: string;
    exchangeRateProvider: string;
    exchangeRateApiKey: string;
    exchangeRateUpdateFrequency: string;
    exchangeRateFallbackMode: string;
    exchangeRateLastUpdatedAt: string;
  };
  operations: {
    backupFrequency: string;
  };
  maintenance: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    maintenancePageTitle: string;
    expectedDuration: string;
    bypassIps: string[];
    bypassRoles: string[];
    autoHealthCheckFrequencyMinutes: number;
    alertOnHealthFailure: boolean;
    convexStatus: string;
    resendStatus: string;
    africasTalkingStatus: string;
    stripeStatus: string;
    mpesaStatus: string;
    workosStatus: string;
    lastHealthCheckAt: string;
    convexDeploymentName: string;
    convexRegion: string;
    convexVersion: string;
    lastBackupAt: string;
  };
};

export const PLATFORM_TIMEZONES = [
  "Africa/Nairobi",
  "Africa/Kampala",
  "Africa/Dar_es_Salaam",
  "Africa/Kigali",
  "Africa/Johannesburg",
  "UTC",
];

export const PLATFORM_LANGUAGES = ["English", "Swahili"];
export const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
export const NUMBER_FORMATS = ["1,000.00", "1.000,00"];
export const CURRENCY_DISPLAY_OPTIONS = ["KES", "USD", "EUR"];
export const WEEK_START_OPTIONS = ["Monday", "Sunday"];
export const ANNOUNCEMENT_TYPES = ["info", "warning", "critical"];
export const LOGIN_LAYOUTS = ["left-content", "right-content", "centered", "fullscreen"];
export const LOGIN_BACKGROUND_TYPES = ["solid", "gradient", "image"];
export const LOGIN_CARD_STYLES = ["flat", "elevated", "glassmorphism"];
export const PORTAL_THEMES = ["light", "dark", "system"];
export const COLLISION_HANDLERS = ["append-number", "prompt-admin"];
export const SSL_PROVIDERS = ["Vercel"];
export const AUTH_METHODS = ["email/password", "Google", "Microsoft", "GitHub", "Magic Link", "SAML"];
export const PAYMENT_ENVIRONMENTS = ["sandbox", "production"];
export const STRIPE_METHODS = ["Card", "SEPA"];
export const MFA_POLICY_OPTIONS = ["required", "optional", "disabled"];
export const GEO_BLOCKING_OPTIONS = ["allow_all", "restrict_selected_countries"];
export const CONSENT_MODES = ["opt-in", "opt-out", "informational"];
export const EXPORT_FORMATS = ["JSON", "CSV", "Both"];
export const EXPORT_DELIVERY_METHODS = ["email_download_link", "in_app_download"];
export const ANALYTICS_SCOPES = ["tenant_portals", "platform_admin", "both", "none"];
export const EXCHANGE_RATE_FREQUENCIES = ["1hr", "6hrs", "24hrs"];
export const EXCHANGE_RATE_FALLBACKS = ["use_last_known_rates", "block_currency_conversion"];
export const NOTIFICATION_CHANNELS = ["in-app", "email", "Slack"];
export const SECURITY_EVENTS = [
  "new admin login",
  "failed login spike",
  "new API key created",
  "impersonation started",
  "bulk data export",
];
export const SLACK_EVENTS = [
  "New tenant signup",
  "Plan upgrade",
  "Churn event",
  "Payment failure",
  "Security alert",
  "Module approved",
  "New publisher application",
  "System error",
];
export const HEALTH_STATUSES = ["OK", "Error", "Checking"];

export const DEFAULT_POST_LOGIN_REDIRECTS: RoleRedirectRow[] = [
  { role: "master_admin", path: "/platform" },
  { role: "super_admin", path: "/platform" },
  { role: "platform_manager", path: "/platform/tenants" },
  { role: "billing_admin", path: "/platform/billing" },
  { role: "support_agent", path: "/platform/tickets" },
];

export const DEFAULT_SENDER_ROWS: SenderIdRow[] = [
  { country: "KE", senderId: "EDUMYLES", status: "pending" },
  { country: "UG", senderId: "EDUMYLES", status: "pending" },
  { country: "TZ", senderId: "EDUMYLES", status: "pending" },
  { country: "RW", senderId: "EDUMYLES", status: "pending" },
];

export const DEFAULT_SETTINGS_DRAFT: SettingsDraft = {
  general: {
    platformName: "EduMyles",
    platformTagline: "Digital infrastructure for modern schools across East Africa.",
    logoLightUrl: "",
    logoDarkUrl: "",
    faviconUrl: "",
    supportEmail: "support@edumyles.com",
    supportPhone: "+254700000000",
    physicalAddress: "Nairobi, Kenya",
    companyRegistrationNumber: "",
    vatRegistrationNumber: "",
    timezone: "Africa/Nairobi",
    language: "English",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1,000.00",
    currencyDisplay: "KES",
    weekStartsOn: "Monday",
    announcementEnabled: false,
    announcementMessage: "",
    announcementType: "info",
    announcementDismissible: true,
    announcementExpiryAt: "",
  },
  branding: {
    primaryColor: "#0F4C2A",
    secondaryColor: "#D29A16",
    accentColor: "#0EA5E9",
    dangerColor: "#DC2626",
    successColor: "#16A34A",
    loginLayout: "left-content",
    loginBackgroundType: "gradient",
    loginBackgroundColor: "#0F4C2A",
    loginBackgroundColor2: "#163B2A",
    loginBackgroundImageUrl: "",
    loginShowLogo: true,
    loginShowTagline: true,
    loginCardStyle: "elevated",
    emailHeaderLogoUrl: "",
    emailHeaderBackgroundColor: "#0F4C2A",
    emailHeaderTextColor: "#FFFFFF",
    emailFooterText: "EduMyles | Nairobi, Kenya",
    emailFooterBackgroundColor: "#0D1B14",
    emailAccentColor: "#D29A16",
    smsSenderName: "EDUMYLES",
    smsSenderApprovalStatus: "pending",
    smsFooterText: "Reply STOP to unsubscribe",
    portalTheme: "system",
    allowTenantBrandOverride: true,
    defaultPortalPrimaryColor: "#0F4C2A",
  },
  domain: {
    primaryDomain: "edumyles.com",
    platformAdminUrl: "platform.edumyles.com",
    apiBaseUrl: "api.edumyles.com",
    subdomainPattern: "{schoolname}.edumyles.com",
    subdomainCharacterRules: "lowercase, alphanumeric, hyphens only, min 3 max 50 chars",
    reservedSubdomains: ["platform", "api", "app", "www", "mail", "support", "developer", "reseller", "affiliate", "docs", "status", "help"],
    autoGenerateSubdomain: true,
    subdomainCollisionHandling: "append-number",
    customDomainsEnabled: true,
    sslProvider: "Vercel",
    sslAutoRenew: true,
    maxCustomDomainsPerTenant: 3,
    customDomainVerificationMethod: "CNAME",
    forceCanonicalDomain: true,
    httpsEnforced: true,
    hstsEnabled: true,
    maintenanceRedirectUrl: "/maintenance",
    notFoundRedirectUrl: "/404",
    loginRedirectUrl: "/login",
    postLoginRedirects: DEFAULT_POST_LOGIN_REDIRECTS,
    developerPortalUrl: "/portal/developer",
    resellerPortalUrl: "/portal/reseller",
    affiliatePortalUrl: "/portal/affiliate",
    developerApplyUrl: "/developer/apply",
    resellerApplyUrl: "/reseller/apply",
  },
  email: {
    provider: "Resend",
    resendApiKey: "",
    fromName: "EduMyles",
    fromEmail: "noreply@edumyles.com",
    replyToEmail: "support@edumyles.com",
    bccEmail: "",
    bounceHandlingEmail: "bounces@edumyles.com",
    dailySendLimit: "Provider plan limit",
    rateLimitPerSecond: "Provider managed",
    openTrackingEnabled: true,
    clickTrackingEnabled: true,
    unsubscribeAlwaysInclude: true,
    sendingDomain: "edumyles.com",
    spfStatus: "checking",
    dkimStatus: "checking",
    dmarcStatus: "checking",
    dnsRecords: "",
    dnsLastVerifiedAt: "",
  },
  sms: {
    provider: "Africa's Talking",
    apiKey: "",
    username: "",
    defaultSenderId: "EDUMYLES",
    defaultSenderApprovalStatus: "pending",
    fallbackSenderId: "40404",
    countrySenderIds: DEFAULT_SENDER_ROWS,
    unicodeSupport: true,
    optOutFooterEnabled: true,
    optOutFooterText: "Txt STOP to opt out",
    monthlyQuota: "Provider plan limit",
    smsUsedThisMonth: 0,
    totalCostThisMonthKes: 0,
  },
  push: {
    provider: "Expo Push",
    expoAccessToken: "",
    notificationIconUrl: "",
    notificationColor: "#0F4C2A",
    notificationSound: "default",
    badgeCountMode: "auto-increment",
    deliveryPriority: "high",
    ttlSeconds: 3600,
    notificationExpiryDays: 30,
  },
  payments: {
    vatRatePct: 16,
    paymentGracePeriodDays: 7,
    autoRetryFailedPayments: true,
    retryFrequencyDays: 2,
    maxRetriesBeforeSuspension: 3,
    baseCurrency: "KES",
    invoiceNumberPrefix: "EDU-",
    invoiceNumberStart: 1000,
    invoiceFooterText: "Thank you for choosing EduMyles.",
    invoiceLogoUrl: "",
    mpesaEnvironment: "production",
    mpesaConsumerKey: "",
    mpesaConsumerSecret: "",
    mpesaShortCode: "",
    mpesaPasskey: "",
    mpesaInitiatorName: "",
    mpesaSecurityCredential: "",
    airtelEnvironment: "production",
    airtelClientId: "",
    airtelClientSecret: "",
    airtelMerchantId: "",
    stripeEnvironment: "production",
    stripePublishableKey: "",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    stripePaymentMethods: ["Card"],
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankBranchCode: "",
    bankSwiftCode: "",
    bankIban: "",
    bankReferenceInstruction: "Use the invoice number as the payment reference.",
    bankInstructions: "",
    bankManualVerification: true,
  },
  security: {
    passwordMinLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialCharacter: true,
    passwordExpiryDays: 0,
    passwordHistoryCount: 5,
    breachCheckEnabled: true,
    sessionTimeoutMinutes: 60,
    absoluteSessionTimeoutHours: 24,
    concurrentSessionsPerUser: 0,
    rememberMeDurationDays: 30,
    revokeSessionsOnPasswordChange: true,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    progressiveLockout: true,
    showLockoutReason: true,
    emailOnNewDeviceLogin: true,
    emailOnFailedLogin: false,
    allowedDomains: [],
    ipAllowlist: [],
    geoBlockingMode: "allow_all",
    allowedCountries: [],
    mfaMasterAdmin: "required",
    mfaSuperAdmin: "required",
    mfaOtherRoles: "optional",
    mfaGracePeriodDays: 7,
    apiRateLimitPerIp: 120,
    apiRateLimitPerUser: 240,
    corsAllowedOrigins: ["https://platform.edumyles.com"],
    contentSecurityPolicy: "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    hstsMaxAge: 31536000,
    securityNotifyEvents: SECURITY_EVENTS,
    securityNotifyChannels: ["in-app", "email"],
  },
  dataPrivacy: {
    auditLogsRetentionDays: 365,
    sessionLogsRetentionDays: 90,
    deletedTenantDataRetentionDays: 90,
    cancelledSubscriptionRetentionDays: 365,
    smsLogsRetentionDays: 90,
    emailLogsRetentionDays: 90,
    analyticsEventsRetentionDays: 365,
    dataExportFormat: "Both",
    autoProcessExportRequests: false,
    exportDeliveryMethod: "email_download_link",
    exportLinkExpiryHours: 48,
    dataProcessingRegisterUrl: "",
    cookieConsentEnabled: true,
    consentMode: "opt-in",
    analyticsConsentRequired: true,
    cookiePolicyUrl: "https://edumyles.com/cookies",
    privacyPolicyUrl: "https://edumyles.com/privacy",
    termsOfServiceUrl: "https://edumyles.com/terms",
    dataProcessingAgreementUrl: "",
    forceReacceptOnPolicyUpdate: false,
    dataResidencyRegion: "Convex Cloud",
  },
  integrations: {
    paymentGateway: "Stripe",
    smsProvider: "Africa's Talking",
    analyticsEnabled: true,
    workosApiKey: "",
    workosClientId: "",
    workosEnvironment: "production",
    workosOrganizationId: "",
    workosCallbackUrl: "https://platform.edumyles.com/api/auth/callback",
    enabledAuthMethods: ["email/password", "Google", "Magic Link"],
    sentryDsn: "",
    sentryEnvironment: "production",
    sentrySampleRate: 1,
    sentryEnableFrontend: true,
    sentryEnableBackend: true,
    slackWebhookUrl: "",
    slackChannel: "#edumyles-alerts",
    slackEvents: ["Payment failure", "Security alert", "System error"],
    googleAnalyticsMeasurementId: "",
    analyticsScope: "both",
    exchangeRateProvider: "Open Exchange Rates",
    exchangeRateApiKey: "",
    exchangeRateUpdateFrequency: "6hrs",
    exchangeRateFallbackMode: "use_last_known_rates",
    exchangeRateLastUpdatedAt: "",
  },
  operations: {
    backupFrequency: "daily",
  },
  maintenance: {
    maintenanceMode: false,
    maintenanceMessage: "We are performing scheduled maintenance. Please check back shortly.",
    maintenancePageTitle: "Platform maintenance in progress",
    expectedDuration: "2 hours",
    bypassIps: [],
    bypassRoles: ["master_admin"],
    autoHealthCheckFrequencyMinutes: 15,
    alertOnHealthFailure: true,
    convexStatus: "OK",
    resendStatus: "Checking",
    africasTalkingStatus: "Checking",
    stripeStatus: "Checking",
    mpesaStatus: "Checking",
    workosStatus: "Checking",
    lastHealthCheckAt: "",
    convexDeploymentName: "",
    convexRegion: "",
    convexVersion: "",
    lastBackupAt: "",
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

function parseStringArray(value: string | undefined, fallback: string[]) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed;
    }
  } catch {
    if (value.trim().startsWith("{") || value.trim().startsWith("[")) {
      return fallback;
    }
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return fallback;
}

function parseObjectArray<T>(value: string | undefined, fallback: T[]): T[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function coerceValue<T>(value: string | undefined, fallback: T): T {
  if (Array.isArray(fallback)) {
    if (fallback.length === 0 || typeof fallback[0] === "string") {
      return parseStringArray(value, fallback as unknown as string[]) as unknown as T;
    }
    return parseObjectArray(value, fallback as unknown as any[]) as unknown as T;
  }
  if (typeof fallback === "boolean") return parseBoolean(value, fallback) as T;
  if (typeof fallback === "number") return parseNumber(value, fallback) as T;
  if (typeof fallback === "string") return parseString(value, fallback) as T;
  return fallback;
}

const SETTING_ALLOWED_VALUES: Record<string, string[]> = {
  "general.timezone": PLATFORM_TIMEZONES,
  "general.language": PLATFORM_LANGUAGES,
  "general.dateFormat": DATE_FORMATS,
  "general.numberFormat": NUMBER_FORMATS,
  "general.currencyDisplay": CURRENCY_DISPLAY_OPTIONS,
  "general.weekStartsOn": WEEK_START_OPTIONS,
  "general.announcementType": ANNOUNCEMENT_TYPES,
  "branding.loginLayout": LOGIN_LAYOUTS,
  "branding.loginBackgroundType": LOGIN_BACKGROUND_TYPES,
  "branding.loginCardStyle": LOGIN_CARD_STYLES,
  "branding.portalTheme": PORTAL_THEMES,
  "domain.subdomainCollisionHandling": COLLISION_HANDLERS,
  "domain.sslProvider": SSL_PROVIDERS,
  "payments.mpesaEnvironment": PAYMENT_ENVIRONMENTS,
  "payments.airtelEnvironment": PAYMENT_ENVIRONMENTS,
  "payments.stripeEnvironment": PAYMENT_ENVIRONMENTS,
  "security.mfaMasterAdmin": MFA_POLICY_OPTIONS,
  "security.mfaSuperAdmin": MFA_POLICY_OPTIONS,
  "security.mfaOtherRoles": MFA_POLICY_OPTIONS,
  "security.geoBlockingMode": GEO_BLOCKING_OPTIONS,
  "dataPrivacy.consentMode": CONSENT_MODES,
  "dataPrivacy.dataExportFormat": EXPORT_FORMATS,
  "dataPrivacy.exportDeliveryMethod": EXPORT_DELIVERY_METHODS,
  "integrations.analyticsScope": ANALYTICS_SCOPES,
  "integrations.exchangeRateUpdateFrequency": EXCHANGE_RATE_FREQUENCIES,
  "integrations.exchangeRateFallbackMode": EXCHANGE_RATE_FALLBACKS,
  "integrations.paymentGateway": ["Stripe", "M-Pesa", "Airtel Money", "Bank Transfer"],
  "integrations.smsProvider": ["Africa's Talking", "Twilio", "Infobip"],
  "operations.backupFrequency": ["hourly", "daily", "weekly", "monthly"],
  "maintenance.convexStatus": HEALTH_STATUSES,
  "maintenance.resendStatus": HEALTH_STATUSES,
  "maintenance.africasTalkingStatus": HEALTH_STATUSES,
  "maintenance.stripeStatus": HEALTH_STATUSES,
  "maintenance.mpesaStatus": HEALTH_STATUSES,
  "maintenance.workosStatus": HEALTH_STATUSES,
};

function validateSettingValue(section: string, key: string, value: unknown, fallback: unknown) {
  const allowedValues = SETTING_ALLOWED_VALUES[`${section}.${key}`];
  if (!allowedValues || typeof value !== "string") {
    return value;
  }
  return allowedValues.includes(value) ? value : fallback;
}

export function serializeSettingValue(value: unknown) {
  if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    return JSON.stringify(value);
  }
  return String(value ?? "");
}

export function sectionToSettings(sectionValues: Record<string, unknown>) {
  return Object.entries(sectionValues).map(([key, value]) => ({
    key,
    value: serializeSettingValue(value),
  }));
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
  const result = structuredClone(draft);
  (Object.keys(result) as Array<keyof SettingsDraft>).forEach((section) => {
    const sectionValues = dbSettings[String(section)] ?? {};
    const sectionDraft = result[section] as Record<string, unknown>;
    Object.keys(sectionDraft).forEach((key) => {
      const fallback = sectionDraft[key];
      const coerced = coerceValue(sectionValues[key], fallback);
      sectionDraft[key] = validateSettingValue(String(section), key, coerced, fallback);
    });
  });
  return result;
}
