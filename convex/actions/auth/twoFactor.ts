"use node";

import { action, ActionCtx } from "../../_generated/server";
import { v } from "convex/values";
import { api } from "../../_generated/api";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export const generateTwoFactorSecret = action({
  args: {
    sessionToken: v.string(),
  },
  handler: async (
    ctx: ActionCtx,
    args: { sessionToken: string }
  ): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> => {
    // Validate session
    const session = await ctx.runQuery(api.sessions.getSession, {
      sessionToken: args.sessionToken,
    });
    if (!session) throw new Error("UNAUTHENTICATED: Invalid session");

    // Get user details
    const user = await ctx.runQuery(api.modules.auth.passwordHelpers.getUserByUserId, {
      sessionToken: args.sessionToken,
      userId: session.userId,
    });
    if (!user) throw new Error("User not found");

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `EduMyles (${user.email})`,
      issuer: "EduMyles Platform",
      length: 32,
    }) as { base32: string; otpauth_url?: string | null };

    // Generate QR code for the secret
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Store the secret temporarily (not enabled yet)
    await ctx.runMutation(api.modules.auth.twoFactorHelpers.storeTempSecret, {
      sessionToken: args.sessionToken,
      userId: session.userId,
      secret: secret.base32,
    });

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: generateBackupCodes(),
    };
  },
});

export const enableTwoFactor = action({
  args: {
    sessionToken: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(api.sessions.getSession, {
      sessionToken: args.sessionToken,
    });
    if (!session) throw new Error("UNAUTHENTICATED: Invalid session");

    // Get temporary secret
    const tempSecret = await ctx.runQuery(api.modules.auth.twoFactorHelpers.getTempSecret, {
      sessionToken: args.sessionToken,
    });
    if (!tempSecret) throw new Error("No 2FA setup in progress");

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: tempSecret.secret,
      encoding: "base32",
      token: args.token,
      window: 2, // Allow 2 time steps before/after
    });

    if (!verified) throw new Error("Invalid authentication code");

    // Enable 2FA for the user
    await ctx.runMutation(api.modules.auth.twoFactorHelpers.enableTwoFactor, {
      sessionToken: args.sessionToken,
      userId: session.userId,
      secret: tempSecret.secret,
      backupCodes: generateBackupCodes(),
    });

    return { success: true };
  },
});

export const disableTwoFactor = action({
  args: {
    sessionToken: v.string(),
    password: v.string(), // Require password for security
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(api.sessions.getSession, {
      sessionToken: args.sessionToken,
    });
    if (!session) throw new Error("UNAUTHENTICATED: Invalid session");

    // Verify password before disabling 2FA
    const user = await ctx.runQuery(api.modules.auth.passwordHelpers.getUserByUserId, {
      sessionToken: args.sessionToken,
      userId: session.userId,
    });
    if (!user) throw new Error("User not found");

    if (user.passwordHash) {
      const crypto = await import("crypto");
      const verifyPassword = (password: string, stored: string): Promise<boolean> => {
        return new Promise((resolve, reject) => {
          const [salt, hash] = stored.split(":");
          if (!salt || !hash) {
            resolve(false);
            return;
          }
          crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
            if (err) reject(err);
            resolve(derivedKey.toString("hex") === hash);
          });
        });
      };

      const valid = await verifyPassword(args.password, user.passwordHash);
      if (!valid) throw new Error("Password is incorrect");
    }

    // Disable 2FA
    await ctx.runMutation(api.modules.auth.twoFactorHelpers.disableTwoFactor, {
      sessionToken: args.sessionToken,
      userId: session.userId,
    });

    return { success: true };
  },
});

export const verifyTwoFactor = action({
  args: {
    sessionToken: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(api.sessions.getSession, {
      sessionToken: args.sessionToken,
    });
    if (!session) throw new Error("UNAUTHENTICATED: Invalid session");

    // Get user's 2FA secret
    const user = await ctx.runQuery(api.modules.auth.passwordHelpers.getUserByUserId, {
      sessionToken: args.sessionToken,
      userId: session.userId,
    });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new Error("2FA is not enabled for this user");
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: args.token,
      window: 2,
    });

    if (!verified) {
      // Check backup codes
      const backupCodeValid = await ctx.runMutation(api.modules.auth.twoFactorHelpers.verifyBackupCode, {
        sessionToken: args.sessionToken,
        userId: session.userId,
        code: args.token,
      });

      if (!backupCodeValid) {
        throw new Error("Invalid authentication code");
      }
    }

    return { success: true };
  },
});

function generateBackupCodes(): string[] {
  const crypto = require("crypto");
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // 4 random bytes → 8 hex chars, matching spec's 8-char backup code format
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}
