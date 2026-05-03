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

interface PasswordResetTokenRecord {
  token: string;
  userId: string;
  used: boolean;
  expiresAt: number;
}

interface PaymentTransactionRecord {
  paymentMethod: "mpesa" | "card" | "bank_transfer";
  amount: number;
  status: "pending" | "completed" | "failed" | "cancelled";
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

function validatePasswordResetTokenUse(
  resetToken: PasswordResetTokenRecord | null,
  userId: string,
  now: number,
  serverSecret?: string
) {
  validateTrustedServer(serverSecret);

  if (!resetToken) {
    throw new Error("Invalid reset token");
  }

  if (resetToken.used) {
    throw new Error("This reset token has already been used");
  }

  if (resetToken.expiresAt < now) {
    throw new Error("This reset token has expired");
  }

  if (resetToken.userId !== userId) {
    throw new Error("Reset token does not match user");
  }

  return resetToken;
}

function validateMarketplacePaymentCallback(
  transaction: PaymentTransactionRecord | null,
  callback: {
    paymentMethod: PaymentTransactionRecord["paymentMethod"];
    status: "success" | "failed" | "cancelled";
    amount: number;
  },
  serverSecret?: string
) {
  validateTrustedServer(serverSecret);

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (transaction.paymentMethod !== callback.paymentMethod) {
    throw new Error("Payment method mismatch");
  }

  if (transaction.status === "completed") {
    return { status: "success", moduleActivated: true };
  }

  if (callback.status === "success" && transaction.amount !== callback.amount) {
    throw new Error("Payment amount mismatch");
  }

  return {
    status: callback.status,
    moduleActivated: callback.status === "success",
  };
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

describe("password reset helper security contract", () => {
  const resetToken: PasswordResetTokenRecord = {
    token: "reset-token-123",
    userId: "USR-victim",
    used: false,
    expiresAt: Date.now() + 60_000,
  };

  it("rejects reset token use without a trusted server secret", () => {
    expect(() =>
      validatePasswordResetTokenUse(resetToken, "USR-victim", Date.now())
    ).toThrow("FORBIDDEN: Trusted server credentials required");
  });

  it("rejects reset token use for a different user", () => {
    expect(() =>
      validatePasswordResetTokenUse(
        resetToken,
        "USR-attacker",
        Date.now(),
        "trusted-secret"
      )
    ).toThrow("Reset token does not match user");
  });

  it("rejects expired or already-used reset tokens inside the write path", () => {
    expect(() =>
      validatePasswordResetTokenUse(
        { ...resetToken, expiresAt: Date.now() - 1 },
        "USR-victim",
        Date.now(),
        "trusted-secret"
      )
    ).toThrow("This reset token has expired");

    expect(() =>
      validatePasswordResetTokenUse(
        { ...resetToken, used: true },
        "USR-victim",
        Date.now(),
        "trusted-secret"
      )
    ).toThrow("This reset token has already been used");
  });

  it("allows trusted reset token use for the owning user", () => {
    expect(
      validatePasswordResetTokenUse(
        resetToken,
        "USR-victim",
        Date.now(),
        "trusted-secret"
      )
    ).toEqual(resetToken);
  });
});

describe("marketplace payment callback security contract", () => {
  const transaction: PaymentTransactionRecord = {
    paymentMethod: "mpesa",
    amount: 2500,
    status: "pending",
  };

  it("rejects callbacks without trusted server credentials", () => {
    expect(() =>
      validateMarketplacePaymentCallback(
        transaction,
        { paymentMethod: "mpesa", status: "success", amount: 2500 }
      )
    ).toThrow("FORBIDDEN: Trusted server credentials required");
  });

  it("rejects successful callbacks with mismatched payment details", () => {
    expect(() =>
      validateMarketplacePaymentCallback(
        transaction,
        { paymentMethod: "card", status: "success", amount: 2500 },
        "trusted-secret"
      )
    ).toThrow("Payment method mismatch");

    expect(() =>
      validateMarketplacePaymentCallback(
        transaction,
        { paymentMethod: "mpesa", status: "success", amount: 1 },
        "trusted-secret"
      )
    ).toThrow("Payment amount mismatch");
  });

  it("allows matching successful callbacks from a trusted server", () => {
    expect(
      validateMarketplacePaymentCallback(
        transaction,
        { paymentMethod: "mpesa", status: "success", amount: 2500 },
        "trusted-secret"
      )
    ).toEqual({ status: "success", moduleActivated: true });
  });
});

describe("WorkOS sync security contract", () => {
  it("rejects direct sync attempts without the trusted Convex webhook secret", () => {
    expect(() => validateTrustedServer()).toThrow(
      "FORBIDDEN: Trusted server credentials required"
    );
  });

  it("allows sync only after the trusted webhook bridge provides the secret", () => {
    expect(validateTrustedServer("trusted-secret")).toBeUndefined();
  });
});
