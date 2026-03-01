// Date formatting
export function formatDate(dateOrTimestamp: Date | number | string): string {
  const date = new Date(dateOrTimestamp);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(dateOrTimestamp: Date | number | string): string {
  const date = new Date(dateOrTimestamp);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(dateOrTimestamp: Date | number | string): string {
  const date = new Date(dateOrTimestamp);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

// Currency formatting (East African currencies)
const CURRENCY_CONFIG: Record<string, { locale: string; symbol: string }> = {
  KES: { locale: "en-KE", symbol: "KES" },
  UGX: { locale: "en-UG", symbol: "UGX" },
  TZS: { locale: "en-TZ", symbol: "TZS" },
  RWF: { locale: "en-RW", symbol: "RWF" },
  ETB: { locale: "en-ET", symbol: "ETB" },
  GHS: { locale: "en-GH", symbol: "GHS" },
  USD: { locale: "en-US", symbol: "$" },
};

export function formatCurrency(
  amountCents: number,
  currency = "KES"
): string {
  const amount = amountCents / 100;
  const config = CURRENCY_CONFIG[currency];
  if (config) {
    try {
      return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${config.symbol} ${amount.toLocaleString()}`;
    }
  }
  return `${currency} ${amount.toLocaleString()}`;
}

// Phone formatting (East African)
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("254") && cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `+254 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

// Name formatting
export function formatName(firstName?: string, lastName?: string): string {
  return [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
}

export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.[0]?.toUpperCase() ?? "";
  const last = lastName?.[0]?.toUpperCase() ?? "";
  return first + last || "?";
}

// Number formatting
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
