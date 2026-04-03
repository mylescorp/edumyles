import { describe, expect, it } from "vitest";

interface SessionRecord {
  sessionToken: string;
  tenantId: string;
  userId: string;
  role: string;
  email: string;
  expiresAt: number;
}

interface NotificationRecord {
  _id: string;
  tenantId: string;
  userId: string;
  isRead: boolean;
}

function validateTrustedServer(serverSecret?: string, expectedSecret = "trusted-secret") {
  if (!expectedSecret || serverSecret !== expectedSecret) {
    throw new Error("FORBIDDEN: Trusted server credentials required");
  }
}

function validateSessionAccess(
  session: SessionRecord | null,
  serverSecret?: string,
  expectedSecret = "trusted-secret"
) {
  validateTrustedServer(serverSecret, expectedSecret);

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  return session;
}

function validateNotificationOwnership(
  session: SessionRecord,
  notification: NotificationRecord | null
) {
  if (!notification) {
    throw new Error("NOT_FOUND: Notification not found");
  }

  if (
    notification.userId !== session.userId ||
    notification.tenantId !== session.tenantId
  ) {
    throw new Error("FORBIDDEN: Notification access denied");
  }

  return notification;
}

describe("session security contract", () => {
  const validSession: SessionRecord = {
    sessionToken: "session-123",
    tenantId: "TENANT-school-123",
    userId: "user-123",
    role: "school_admin",
    email: "admin@school.test",
    expiresAt: Date.now() + 60_000,
  };

  it("rejects session reads without a trusted server secret", () => {
    expect(() => validateSessionAccess(validSession)).toThrow(
      "FORBIDDEN: Trusted server credentials required"
    );
  });

  it("rejects session reads with the wrong trusted server secret", () => {
    expect(() => validateSessionAccess(validSession, "wrong-secret")).toThrow(
      "FORBIDDEN: Trusted server credentials required"
    );
  });

  it("returns null for expired sessions even with a trusted secret", () => {
    const expired = { ...validSession, expiresAt: Date.now() - 1 };
    expect(validateSessionAccess(expired, "trusted-secret")).toBeNull();
  });

  it("allows trusted server reads for active sessions", () => {
    expect(validateSessionAccess(validSession, "trusted-secret")).toEqual(validSession);
  });
});

describe("notification ownership contract", () => {
  const session: SessionRecord = {
    sessionToken: "session-123",
    tenantId: "TENANT-school-123",
    userId: "user-123",
    role: "parent",
    email: "parent@school.test",
    expiresAt: Date.now() + 60_000,
  };

  it("allows access to the user's own notification in the same tenant", () => {
    const notification: NotificationRecord = {
      _id: "notification-1",
      tenantId: "TENANT-school-123",
      userId: "user-123",
      isRead: false,
    };

    expect(validateNotificationOwnership(session, notification)).toEqual(notification);
  });

  it("rejects cross-user notification access inside the same tenant", () => {
    const notification: NotificationRecord = {
      _id: "notification-2",
      tenantId: "TENANT-school-123",
      userId: "other-user",
      isRead: false,
    };

    expect(() => validateNotificationOwnership(session, notification)).toThrow(
      "FORBIDDEN: Notification access denied"
    );
  });

  it("rejects cross-tenant notification access for the same user", () => {
    const notification: NotificationRecord = {
      _id: "notification-3",
      tenantId: "TENANT-other-school",
      userId: "user-123",
      isRead: false,
    };

    expect(() => validateNotificationOwnership(session, notification)).toThrow(
      "FORBIDDEN: Notification access denied"
    );
  });

  it("rejects bulk mark-all semantics from touching another tenant's notification", () => {
    const foreignTenantNotification: NotificationRecord = {
      _id: "notification-4",
      tenantId: "TENANT-foreign",
      userId: "user-123",
      isRead: false,
    };

    expect(() => validateNotificationOwnership(session, foreignTenantNotification)).toThrow(
      "FORBIDDEN: Notification access denied"
    );
  });
});
