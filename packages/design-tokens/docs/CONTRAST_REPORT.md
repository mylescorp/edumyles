# Contrast report (verified by `npm run check:contrast`)

All semantic text pairs pass 4.5:1 and control boundaries and focus ring pass 3:1, in light and dark.

## Corrections to the earlier directive values
| Token | Directive value | Problem | v1.0 value |
|---|---|---|---|
| input (light) | #D4D4D4 | 1.48:1 on white, fails 3:1 for control boundaries | #8A8A8A (3.45:1) |
| input (dark) | #3A4A60 | 1.77:1 on card, fails 3:1 | #6B7C93 (3.74:1) |
| success / warning solid with white text | #16A34A / #D97706 | 3.3:1 / 2.9:1 | #1B7F4B / #B45309 (5.02:1) |
| muted-foreground on muted | #737373 | 4.36:1 | #666666 (5.27:1) |

## Known limits
- Gold #C79639 on white is 2.68:1. Never use as text. Navy on gold is 4.41:1: use for fills with large or bold text only, or use ink #171717.
- Border (#E5E5E5) is decorative card structure. It must not be the only thing identifying an interactive control; use the `input` token for that.
- Tenant dark primaries come from `deriveDarkPrimary` (minimum passing lightness, 4.5:1 on the dark card). Example output: #1565C0 -> #388BE9, #2E7D32 -> #399B3E, #7B1F3A -> #D76184. Pair the result with `readableForeground()` for button text and re-check; the dark tenant values shown on the canvas were hand-picked estimates and these function outputs are authoritative.
