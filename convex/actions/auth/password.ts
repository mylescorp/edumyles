"use node";

import { action } from "../../_generated/server";
import { v } from "convex/values";
import { api } from "../../_generated/api";
import crypto from "crypto";
import { validatePassword } from "../../modules/auth/passwordPolicy";

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const ITERATIONS = 100000;
const DIGEST = "sha512";

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

function verifyPassword(password: string, stored: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) {
      resolve(false);
      return;
    }
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex") === hash);
    });
  });
}

export const changePassword = action({
  args: {
    sessionToken: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(api.sessions.getCurrentSession, {
      sessionToken: args.sessionToken,
    });
    if (!session) throw new Error("UNAUTHENTICATED: Invalid session");

    // Get user
    const user = await ctx.runQuery(api.modules.auth.passwordHelpers.getUserByUserId, {
      sessionToken: args.sessionToken,
      userId: session.userId,
    });
    if (!user) throw new Error("User not found");

    // If user has existing password, verify current password
    if (user.passwordHash) {
      const valid = await verifyPassword(args.currentPassword, user.passwordHash);
      if (!valid) throw new Error("Current password is incorrect");
    }

    // Validate new password using comprehensive policy
    const policy = await ctx.runQuery(api.modules.auth.passwordPolicy.getPasswordPolicy);
    const validation = validatePassword(args.newPassword, policy);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // Hash new password
    const newHash = await hashPassword(args.newPassword);

    // Update password in database
    await ctx.runMutation(api.modules.auth.passwordHelpers.updatePasswordHash, {
      sessionToken: args.sessionToken,
      userId: session.userId,
      passwordHash: newHash,
    });

    // Invalidate all other sessions (force re-login on other devices)
    await ctx.runMutation(api.sessions.deleteAllUserSessions, {
      sessionToken: args.sessionToken,
      exceptCurrent: true,
    });

    return { success: true };
  },
});

export const setInitialPassword = action({
  args: {
    sessionToken: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(api.sessions.getCurrentSession, {
      sessionToken: args.sessionToken,
    });
    if (!session) throw new Error("UNAUTHENTICATED: Invalid session");

    const policy = await ctx.runQuery(api.modules.auth.passwordPolicy.getPasswordPolicy);
    const validation = validatePassword(args.newPassword, policy);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    const newHash = await hashPassword(args.newPassword);

    await ctx.runMutation(api.modules.auth.passwordHelpers.updatePasswordHash, {
      sessionToken: args.sessionToken,
      userId: session.userId,
      passwordHash: newHash,
    });

    return { success: true };
  },
});

export const requestPasswordReset = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate a secure reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    // Store the token (this will also check if user exists)
    await ctx.runMutation(api.modules.auth.passwordHelpers.createResetToken, {
      email: args.email,
      token,
      expiresAt,
    });

    // In production, send email here. For now, log the token.
    console.log(`[Password Reset] Token for ${args.email}: ${token}`);

    return { success: true, message: "If an account exists with that email, a reset link has been sent." };
  },
});

export const resetPassword = action({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const policy = await ctx.runQuery(api.modules.auth.passwordPolicy.getPasswordPolicy);
    const validation = validatePassword(args.newPassword, policy);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // Validate token and get userId
    const resetToken = await ctx.runQuery(api.modules.auth.passwordHelpers.getResetToken, {
      token: args.token,
    });

    if (!resetToken) throw new Error("Invalid or expired reset token");
    if (resetToken.used) throw new Error("This reset token has already been used");
    if (resetToken.expiresAt < Date.now()) throw new Error("This reset token has expired");

    const newHash = await hashPassword(args.newPassword);

    // Update password and mark token as used
    await ctx.runMutation(api.modules.auth.passwordHelpers.resetPasswordWithToken, {
      token: args.token,
      userId: resetToken.userId,
      passwordHash: newHash,
    });

    return { success: true };
  },
});
