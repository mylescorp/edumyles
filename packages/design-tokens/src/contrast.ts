const HEX = /^#[0-9A-Fa-f]{6}$/;
const WHITE = "#FFFFFF";
const INK = "#171717";
const DARK_CARD = "#172235";
const MIN_TEXT = 4.5;

export function isHex(value: string): boolean {
  return HEX.test(value);
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function toHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function fromHsl(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const rgb: [number, number, number] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const hex = (v: number): string => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${hex(rgb[0])}${hex(rgb[1])}${hex(rgb[2])}`.toUpperCase();
}

export function readableForeground(background: string): string {
  return contrastRatio(WHITE, background) >= contrastRatio(INK, background) ? WHITE : INK;
}

export interface PrimaryCheck {
  ok: boolean;
  ratioWithWhite: number;
  /** Nearest darker shade that passes with white text, when the input fails. */
  suggestion: string | null;
}

/** Light-mode rule: a tenant primary must reach 4.5:1 with white text. Never silently accepts a failing colour. */
export function checkPrimary(hex: string): PrimaryCheck {
  const ratio = contrastRatio(hex, WHITE);
  if (ratio >= MIN_TEXT) return { ok: true, ratioWithWhite: ratio, suggestion: null };
  const [h, s, l0] = toHsl(hex);
  for (let l = l0; l > 0.05; l -= 0.01) {
    const candidate = fromHsl(h, s, l);
    if (contrastRatio(candidate, WHITE) >= MIN_TEXT) return { ok: false, ratioWithWhite: ratio, suggestion: candidate };
  }
  return { ok: false, ratioWithWhite: ratio, suggestion: null };
}

/** Dark-mode variant: raise lightness until it reaches 4.5:1 on the dark card surface. */
export function deriveDarkPrimary(hex: string): string {
  const [h, s, l0] = toHsl(hex);
  for (let l = l0; l <= 0.95; l += 0.01) {
    const candidate = fromHsl(h, s, l);
    if (contrastRatio(candidate, DARK_CARD) >= MIN_TEXT) return candidate;
  }
  return WHITE;
}
