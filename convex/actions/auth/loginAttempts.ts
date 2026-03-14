import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const checkLockout = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("loginAttempts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!record) return { locked: false, attemptsRemaining: MAX_ATTEMPTS };

    if (record.lockedUntil && record.lockedUntil > Date.now()) {
      const remainingMs = record.lockedUntil - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return {
        locked: true,
        attemptsRemaining: 0,
        lockedUntilMs: record.lockedUntil,
        message: `Account locked. Try again in ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}.`,
      };
    }

    // Reset if lockout period has passed
    if (record.lockedUntil && record.lockedUntil <= Date.now()) {
      return { locked: false, attemptsRemaining: MAX_ATTEMPTS };
    }

    return {
      locked: false,
      attemptsRemaining: MAX_ATTEMPTS - record.attempts,
    };
  },
});

export const recordFailedAttempt = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("loginAttempts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!record) {
      await ctx.db.insert("loginAttempts", {
        email: args.email,
        attempts: 1,
        lastAttemptAt: Date.now(),
      });
      return { locked: false, attemptsRemaining: MAX_ATTEMPTS - 1 };
    }

    // If previous lockout has expired, reset counter
    if (record.lockedUntil && record.lockedUntil <= Date.now()) {
      await ctx.db.patch(record._id, {
        attempts: 1,
        lastAttemptAt: Date.now(),
        lockedUntil: undefined,
      });
      return { locked: false, attemptsRemaining: MAX_ATTEMPTS - 1 };
    }

    const newAttempts = record.attempts + 1;

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      await ctx.db.patch(record._id, {
        attempts: newAttempts,
        lastAttemptAt: Date.now(),
        lockedUntil,
      });
      return {
        locked: true,
        attemptsRemaining: 0,
        message: "Too many failed attempts. Account locked for 15 minutes.",
      };
    }

    await ctx.db.patch(record._id, {
      attempts: newAttempts,
      lastAttemptAt: Date.now(),
    });

    return {
      locked: false,
      attemptsRemaining: MAX_ATTEMPTS - newAttempts,
    };
  },
});

export const clearAttempts = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("loginAttempts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (record) {
      await ctx.db.delete(record._id);
    }
  },
});
