import { describe, expect, it } from "vitest";
import {
  applyDbSettings,
  DEFAULT_SETTINGS_DRAFT,
  sectionToSettings,
} from "../app/platform/settings/settingsDraft";

describe("platform settings draft helpers", () => {
  it("falls back to defaults when persisted values are invalid", () => {
    const result = applyDbSettings(DEFAULT_SETTINGS_DRAFT, {
      general: {
        timezone: "Mars/Phobos",
        dateFormat: "RANDOM",
      },
      security: {
        passwordMinLength: "oops",
        allowedDomains: "{bad json",
      },
      integrations: {
        paymentGateway: "cash",
        smsProvider: "carrier-pigeon",
      },
      operations: {
        backupFrequency: "yearly",
      },
    });

    expect(result.general.timezone).toBe(DEFAULT_SETTINGS_DRAFT.general.timezone);
    expect(result.general.dateFormat).toBe(DEFAULT_SETTINGS_DRAFT.general.dateFormat);
    expect(result.security.passwordMinLength).toBe(DEFAULT_SETTINGS_DRAFT.security.passwordMinLength);
    expect(result.security.allowedDomains).toEqual(DEFAULT_SETTINGS_DRAFT.security.allowedDomains);
    expect(result.integrations.paymentGateway).toBe(DEFAULT_SETTINGS_DRAFT.integrations.paymentGateway);
    expect(result.integrations.smsProvider).toBe(DEFAULT_SETTINGS_DRAFT.integrations.smsProvider);
    expect(result.operations.backupFrequency).toBe(DEFAULT_SETTINGS_DRAFT.operations.backupFrequency);
  });

  it("round-trips booleans, numbers, and arrays through section serialization", () => {
    const serialized = sectionToSettings({
      maxLoginAttempts: 9,
      analyticsEnabled: false,
      allowedDomains: ["edumyles.com", "schools.edumyles.com"],
    });

    expect(serialized).toEqual([
      { key: "maxLoginAttempts", value: "9" },
      { key: "analyticsEnabled", value: "false" },
      {
        key: "allowedDomains",
        value: JSON.stringify(["edumyles.com", "schools.edumyles.com"]),
      },
    ]);

    const hydrated = applyDbSettings(DEFAULT_SETTINGS_DRAFT, {
      security: {
        maxLoginAttempts: serialized[0].value,
        allowedDomains: serialized[2].value,
      },
      integrations: {
        analyticsEnabled: serialized[1].value,
      },
    });

    expect(hydrated.security.maxLoginAttempts).toBe(9);
    expect(hydrated.integrations.analyticsEnabled).toBe(false);
    expect(hydrated.security.allowedDomains).toEqual([
      "edumyles.com",
      "schools.edumyles.com",
    ]);
  });
});
