// Run: node --test tools/theme.test.mjs   (CI gate: any failing contrast assertion blocks publish)
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { compile, validate, contrast } from './compile-theme.mjs';
const load = f => JSON.parse(fs.readFileSync(new URL(`../examples/${f}.theme.json`, import.meta.url)));
for (const f of ['default','high-saturation','low-contrast']) {
  test(`${f}: every contrast assertion passes in light and dark`, () => {
    const r = compile(load(f)); assert.ok(r.ok); const bad = r.checks.filter(c => !c.pass); assert.deepEqual(bad, []);
  });
}
test('rejects unknown keys, raw CSS and unapproved fonts', () => {
  const t = load('default'); t.customCss = 'a{}'; t.typography = { font: 'Comic Sans' };
  const e = validate(t); assert.ok(e.some(x => x.includes('customCss'))); assert.ok(e.some(x => x.includes('approved')));
});
test('failure messages are produced for faint brand colours', () => {
  const r = compile(load('low-contrast')); assert.ok(r.notes.some(n => n.level === 'adjusted'));
});
test('white on #FFFFFF is 1:1 and black on white is 21:1', () => { assert.equal(contrast('#FFFFFF','#FFFFFF'), 1); assert.ok(Math.abs(contrast('#000000','#FFFFFF') - 21) < .01); });
