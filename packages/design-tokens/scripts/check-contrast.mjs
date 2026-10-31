import { readFileSync } from "node:fs";

const t = JSON.parse(readFileSync(new URL("../tokens.json", import.meta.url), "utf8"));
const ch = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255); };
const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

const text = [["foreground", "background"], ["foreground", "card"], ["card-foreground", "card"], ["muted-foreground", "background"], ["muted-foreground", "muted"],
  ["primary-foreground", "primary"], ["accent-foreground", "accent"], ["secondary-foreground", "secondary"],
  ...["success", "warning", "danger", "info"].flatMap((s) => [[`${s}-foreground`, s], [`${s}-muted-foreground`, `${s}-muted`]])];
const ui = [["input", "card"], ["input", "background"], ["ring", "background"], ["ring", "card"]];

let failed = 0;
for (const mode of ["light", "dark"]) {
  const s = t.semantic[mode];
  for (const [list, min] of [[text, 4.5], [ui, 3]]) {
    for (const [fg, bg] of list) {
      const r = cr(s[fg], s[bg]);
      if (r < min) { failed++; console.error(`FAIL ${mode} ${fg} on ${bg}: ${r.toFixed(2)} (needs ${min})`); }
    }
  }
}
if (failed) { console.error(`${failed} contrast failure(s)`); process.exit(1); }
console.log("All semantic token pairs pass (text 4.5:1, UI components 3:1).");
