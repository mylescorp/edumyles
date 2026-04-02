"use client";

import { useTenant } from "./useTenant";

const COUNTRY_CURRENCY: Record<string, { currency: string; symbol: string }> = {
  // By ISO code
  KE: { currency: "KES", symbol: "KSh" },
  UG: { currency: "UGX", symbol: "USh" },
  TZ: { currency: "TZS", symbol: "TSh" },
  RW: { currency: "RWF", symbol: "RF"  },
  ET: { currency: "ETB", symbol: "Br"  },
  GH: { currency: "GHS", symbol: "GH₵" },
  // By full name (as stored in some tenant records)
  KENYA:     { currency: "KES", symbol: "KSh" },
  UGANDA:    { currency: "UGX", symbol: "USh" },
  TANZANIA:  { currency: "TZS", symbol: "TSh" },
  RWANDA:    { currency: "RWF", symbol: "RF"  },
  ETHIOPIA:  { currency: "ETB", symbol: "Br"  },
  GHANA:     { currency: "GHS", symbol: "GH₵" },
};

const DEFAULT = { currency: "KES", symbol: "KSh" };

/**
 * Returns the currency symbol and code for the current tenant's country.
 * Falls back to KES / KSh if the country is unknown.
 *
 * Usage:
 *   const { symbol, currency, format } = useCurrency();
 *   format(12500) // → "KSh 12,500"
 */
export function useCurrency() {
  const { tenant } = useTenant();
  const country = (tenant?.country ?? "").toUpperCase().trim();
  const info = COUNTRY_CURRENCY[country] ?? DEFAULT;

  function format(amount: number): string {
    return `${info.symbol} ${amount.toLocaleString()}`;
  }

  return { ...info, format };
}
