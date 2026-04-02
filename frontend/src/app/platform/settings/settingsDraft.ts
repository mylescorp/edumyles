export type SettingsDraft = {
  general: {
    platformName: string;
    platformDescription: string;
    timezone: string;
    dateFormat: string;
  };
  security: {
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecialChars: boolean;
    passwordMaxLength: number;
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
    twoFactorRequired: boolean;
    allowedDomains: string[];
  };
  integrations: {
    paymentGateway: string;
    smsProvider: string;
    analyticsEnabled: boolean;
  };
  operations: {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    backupFrequency: string;
    retentionDays: number;
  };
};

export const PLATFORM_TIMEZONES = ["Africa/Nairobi", "Africa/Kampala", "Africa/Dar_es_Salaam", "UTC"];
export const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
export const PAYMENT_GATEWAYS = ["stripe", "mpesa", "airtel_money", "bank_transfer"];
export const SMS_PROVIDERS = ["africastalking", "twilio", "none"];
export const BACKUP_FREQUENCIES = ["hourly", "daily", "weekly"];

export const DEFAULT_SETTINGS_DRAFT: SettingsDraft = {
  general: {
    platformName: "EduMyles",
    platformDescription: "Comprehensive school management platform",
    timezone: "Africa/Nairobi",
    dateFormat: "DD/MM/YYYY",
  },
  security: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    passwordMaxLength: 128,
    sessionTimeoutMinutes: 480,
    maxLoginAttempts: 5,
    twoFactorRequired: false,
    allowedDomains: ["edumyles.com"],
  },
  integrations: {
    paymentGateway: "stripe",
    smsProvider: "africastalking",
    analyticsEnabled: true,
  },
  operations: {
    maintenanceMode: false,
    registrationEnabled: true,
    backupFrequency: "daily",
    retentionDays: 30,
  },
};

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return value === "true";
}

function parseNumber(value: string | undefined, fallback: number) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseStringArray(value: string | undefined, fallback: string[]) {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function parseEnumValue(value: string | undefined, allowedValues: string[], fallback: string) {
  if (!value) return fallback;
  return allowedValues.includes(value) ? value : fallback;
}

export function sectionToSettings(data: Record<string, unknown>): Array<{ key: string; value: string }> {
  return Object.entries(data).map(([key, value]) => ({
    key,
    value: typeof value === "object" ? JSON.stringify(value) : String(value),
  }));
}

export function applyDbSettings(
  draft: SettingsDraft,
  dbSettings: Record<string, Record<string, string>>
): SettingsDraft {
  const result: SettingsDraft = {
    general: { ...draft.general },
    security: { ...draft.security },
    integrations: { ...draft.integrations },
    operations: { ...draft.operations },
  };

  const general = dbSettings.general ?? {};
  result.general = {
    platformName: general.platformName ?? draft.general.platformName,
    platformDescription: general.platformDescription ?? draft.general.platformDescription,
    timezone: parseEnumValue(general.timezone, PLATFORM_TIMEZONES, draft.general.timezone),
    dateFormat: parseEnumValue(general.dateFormat, DATE_FORMATS, draft.general.dateFormat),
  };

  const security = dbSettings.security ?? {};
  result.security = {
    passwordMinLength: parseNumber(security.passwordMinLength, draft.security.passwordMinLength),
    passwordRequireUppercase: parseBoolean(
      security.passwordRequireUppercase,
      draft.security.passwordRequireUppercase
    ),
    passwordRequireLowercase: parseBoolean(
      security.passwordRequireLowercase,
      draft.security.passwordRequireLowercase
    ),
    passwordRequireNumbers: parseBoolean(
      security.passwordRequireNumbers,
      draft.security.passwordRequireNumbers
    ),
    passwordRequireSpecialChars: parseBoolean(
      security.passwordRequireSpecialChars,
      draft.security.passwordRequireSpecialChars
    ),
    passwordMaxLength: parseNumber(security.passwordMaxLength, draft.security.passwordMaxLength),
    sessionTimeoutMinutes: parseNumber(
      security.sessionTimeoutMinutes,
      draft.security.sessionTimeoutMinutes
    ),
    maxLoginAttempts: parseNumber(security.maxLoginAttempts, draft.security.maxLoginAttempts),
    twoFactorRequired: parseBoolean(security.twoFactorRequired, draft.security.twoFactorRequired),
    allowedDomains: parseStringArray(security.allowedDomains, draft.security.allowedDomains),
  };

  const integrations = dbSettings.integrations ?? {};
  result.integrations = {
    paymentGateway: parseEnumValue(
      integrations.paymentGateway,
      PAYMENT_GATEWAYS,
      draft.integrations.paymentGateway
    ),
    smsProvider: parseEnumValue(
      integrations.smsProvider,
      SMS_PROVIDERS,
      draft.integrations.smsProvider
    ),
    analyticsEnabled: parseBoolean(
      integrations.analyticsEnabled,
      draft.integrations.analyticsEnabled
    ),
  };

  const operations = dbSettings.operations ?? {};
  result.operations = {
    maintenanceMode: parseBoolean(
      operations.maintenanceMode,
      draft.operations.maintenanceMode
    ),
    registrationEnabled: parseBoolean(
      operations.registrationEnabled,
      draft.operations.registrationEnabled
    ),
    backupFrequency: parseEnumValue(
      operations.backupFrequency,
      BACKUP_FREQUENCIES,
      draft.operations.backupFrequency
    ),
    retentionDays: parseNumber(operations.retentionDays, draft.operations.retentionDays),
  };

  return result;
}
