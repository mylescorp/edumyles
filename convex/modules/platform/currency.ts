import { internal } from "../../_generated/api";
import { query, mutation, internalAction, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { SUPPORTED_COUNTRIES } from "../../../shared/src/constants/index";
import { requirePlatformRole } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

export const getCurrencyRates = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "analytics_viewer",
      "billing_admin",
      "platform_manager",
      "marketplace_reviewer",
      "content_moderator",
      "support_agent",
      "super_admin",
      "master_admin",
    ]);
    return await ctx.db.query("currency_rates").collect();
  },
});

export const getSupportedCurrencies = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "analytics_viewer",
      "billing_admin",
      "platform_manager",
      "marketplace_reviewer",
      "content_moderator",
      "support_agent",
      "super_admin",
      "master_admin",
    ]);
    const unique = new Map(
      SUPPORTED_COUNTRIES.map((country) => [
        country.currency,
        { code: country.currency, country: country.name, symbol: country.symbol },
      ])
    );
    return Array.from(unique.values());
  },
});

export const persistCurrencyRates = internalMutation({
  args: {
    rates: v.optional(
      v.array(
        v.object({
          fromCurrency: v.string(),
          toCurrency: v.string(),
          rate: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const incomingRates =
      args.rates ??
      SUPPORTED_COUNTRIES.filter((country) => country.currency !== "KES").map((country) => ({
        fromCurrency: "KES",
        toCurrency: country.currency,
        rate: 1,
      }));

    for (const rate of incomingRates) {
      const existing = await ctx.db
        .query("currency_rates")
        .withIndex("by_pair", (q) =>
          q.eq("fromCurrency", rate.fromCurrency).eq("toCurrency", rate.toCurrency)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          rate: rate.rate,
          fetchedAt: now,
          createdAt: existing.createdAt ?? now,
        });
      } else {
        await ctx.db.insert("currency_rates", {
          fromCurrency: rate.fromCurrency,
          toCurrency: rate.toCurrency,
          rate: rate.rate,
          fetchedAt: now,
          createdAt: now,
        });
      }
    }

    return { success: true, updatedCount: incomingRates.length, fetchedAt: now };
  },
});

export const updateCurrencyRates = internalAction({
  args: {
    rates: v.optional(
      v.array(
        v.object({
          fromCurrency: v.string(),
          toCurrency: v.string(),
          rate: v.number(),
        })
      )
    ),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; updatedCount: number; fetchedAt: number }> => {
    return await ctx.runMutation((internal as any).modules.platform.currency.persistCurrencyRates, {
      rates: args.rates,
    });
  },
});

export const upsertCurrencyRateOverride = mutation({
  args: {
    sessionToken: v.string(),
    fromCurrency: v.string(),
    toCurrency: v.string(),
    rate: v.number(),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "billing_admin",
      "master_admin",
    ]);

    const existing = await ctx.db
      .query("currency_rates")
      .withIndex("by_pair", (q) =>
        q.eq("fromCurrency", args.fromCurrency).eq("toCurrency", args.toCurrency)
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        rate: args.rate,
        fetchedAt: now,
      });
    } else {
      await ctx.db.insert("currency_rates", {
        fromCurrency: args.fromCurrency,
        toCurrency: args.toCurrency,
        rate: args.rate,
        fetchedAt: now,
        createdAt: now,
      });
    }

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "settings.updated",
      entityType: "currency_rate",
      entityId: `${args.fromCurrency}_${args.toCurrency}`,
      after: { fromCurrency: args.fromCurrency, toCurrency: args.toCurrency, rate: args.rate },
    });

    return { success: true };
  },
});
