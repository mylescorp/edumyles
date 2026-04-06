import { internal } from "../../_generated/api";
import { query, internalAction, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { SUPPORTED_COUNTRIES } from "../../../shared/src/constants/index";

export const getCurrencyRates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("currency_rates").collect();
  },
});

export const getSupportedCurrencies = query({
  args: {},
  handler: async () => {
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
