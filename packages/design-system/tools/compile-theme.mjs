// EduMyles theme compiler — reference implementation (no dependencies, Node 18+).
// Input: tenant theme JSON (brand inputs only). Output: validated, derived CSS custom properties + a report.
// Usage: node compile-theme.mjs examples/default.theme.json  -> prints CSS + report, writes ../generated/<tenant>.css and .report.json
import fs from 'node:fs';
import path from 'node:path';

// ---------- colour maths (sRGB <-> OKLab/OKLCH, WCAG luminance) ----------
const hex2rgb = h => { h = h.replace('#',''); return [0,2,4].map(i => parseInt(h.slice(i,i+2),16)/255); };
const rgb2hex = c => '#' + c.map(v => Math.round(Math.min(1,Math.max(0,v))*255).toString(16).padStart(2,'0')).join('').toUpperCase();
const lin = v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4;
const unlin = v => v <= .0031308 ? v*12.92 : 1.055*v**(1/2.4)-.055;
export const lum = h => { const [r,g,b] = hex2rgb(h).map(lin); return .2126*r+.7152*g+.0722*b; };
export const contrast = (a,b) => { const [x,y] = [lum(a),lum(b)].sort((p,q)=>q-p); return (x+.05)/(y+.05); };
function hex2oklch(h){ const [r,g,b]=hex2rgb(h).map(lin);
  const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b), m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b), s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
  const L=.2104542553*l+.793617785*m-.0040720468*s, A=1.9779984951*l-2.428592205*m+.4505937099*s, B=.0259040371*l+.7827717662*m-.808675766*s;
  return {L, C:Math.hypot(A,B), h:(Math.atan2(B,A)*180/Math.PI+360)%360}; }
function oklch2hex({L,C,h}){ // gamut-map by reducing chroma until in sRGB
  for(let c=C;c>=0;c-=.002){ const a=c*Math.cos(h*Math.PI/180), b=c*Math.sin(h*Math.PI/180);
    const l=(L+.3963377774*a+.2158037573*b)**3, m=(L-.1055613458*a-.0638541728*b)**3, s=(L-.0894841775*a-1.291485548*b)**3;
    const rgb=[4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s];
    if(rgb.every(v=>v>=-.0005&&v<=1.0005)) return rgb2hex(rgb.map(unlin)); }
  return rgb2hex([L,L,L].map(unlin)); }
const tweak = (h, dL, cMul=1) => { const k=hex2oklch(h); return oklch2hex({L:Math.min(.99,Math.max(.01,k.L+dL)), C:k.C*cMul, h:k.h}); };
const withL = (h, L, cMul=1) => { const k=hex2oklch(h); return oklch2hex({L, C:k.C*cMul, h:k.h}); };

// ---------- platform constants (locked, from the token spec) ----------
export const PLATFORM = {
  light: { surface:'#FFFFFF', surfaceBg:'#F4F4F5', raised:'#FFFFFF', text:'#171717', muted:'#666666', border:'#E5E5E5', ring:'#0F4FA0' },
  dark:  { surface:'#172235', surfaceBg:'#0B111C', raised:'#172235', text:'#F8FAFC', muted:'#A3B1C2', border:'#2B3A4F', ring:'#6FA2F3' },
  inkOnColour:'#171717', white:'#FFFFFF', navyOnColour:'#082A56'
};
const MIN = { text:4.5, ui:3 };

// pick best on-colour for a fill; returns {colour, ratio}
function onColour(fill, mode){
  const dark = mode==='dark' ? PLATFORM.navyOnColour : PLATFORM.inkOnColour;
  const cw = contrast(fill, PLATFORM.white), cd = contrast(fill, dark);
  return cw >= cd && cw >= MIN.text ? {colour:PLATFORM.white, ratio:cw} : {colour:dark, ratio:cd};
}
// darken/lighten the brand hue until it reaches `target` contrast against `against`; direction auto
function reach(hex, against, target, prefer){
  let k=hex2oklch(hex), best=hex, dir = prefer ?? (lum(against)>.5 ? -1 : 1);
  for(let i=0;i<80 && contrast(best,against)<target;i++){ k.L=Math.min(.99,Math.max(.01,k.L+dir*.01)); best=oklch2hex(k); }
  return best;
}

// ---------- derive one mode ----------
function deriveMode(input, mode, notes, key){
  const P = PLATFORM[mode]; const out = {};
  const base = input;
  // 1. FILL: light mode keeps the brand colour exactly (text colour adapts). Dark mode lifts lightness so the fill reads on dark surfaces (>=3:1 vs surface).
  let fill = base;
  if(mode==='dark'){
    const k=hex2oklch(base); const L=Math.max(k.L,.72); fill = withL(base, Math.min(L,.82), .92);
    fill = reach(fill, P.surface, MIN.ui, +1);
    if(fill!==base) notes.push(info(key,'dark',`Dark-mode ${key} derived at lightness ${(hex2oklch(fill).L*100).toFixed(0)}% so the fill keeps 3:1 against the dark surface.`));
  }
  // light mode keeps the brand fill exactly. If the fill is too faint against the page (<3:1) the label still identifies the button,
  // so we keep the brand colour and add a >=3:1 border instead of recolouring the brand.
  const faint = mode==='light' && contrast(base,P.surface) < MIN.ui;
  if(faint) notes.push(warn(key,'light',`Brand ${key} (${base}) is ${contrast(base,P.surface).toFixed(2)}:1 against the page, below the 3:1 needed to see a control's edge. The brand fill is kept and controls get a ${reach(base,P.surface,MIN.ui,-1)} border (${contrast(reach(base,P.surface,MIN.ui,-1),P.surface).toFixed(2)}:1).`));
  const on = onColour(fill, mode);
  if(on.colour!==PLATFORM.white && mode==='light') notes.push(info(key,'light',`White text on ${fill} is only ${contrast(fill,PLATFORM.white).toFixed(2)}:1, so text on this colour is ${on.colour} (${on.ratio.toFixed(2)}:1).`));
  // 2. TEXT-ON-SURFACE shade (links, outline buttons, selected tab labels): >=4.5:1 on surface and on raised
  let txt = fill; const worst = s => Math.min(contrast(txt,s), contrast(txt,P.surfaceBg));
  for(let i=0;i<80 && worst(P.surface)<MIN.text;i++){ txt = tweak(txt, mode==='dark'?.01:-.01); }
  if(txt!==fill) notes.push(info(key,mode,`A separate ${key} text shade (${txt}) is used for links and outline buttons so they stay at ${contrast(txt,P.surface).toFixed(2)}:1 on the surface.`));
  // 3. states
  const dL = on.colour===PLATFORM.white ? -1 : +1; // keep label contrast: darken under white text, lighten under dark text
  const hover = tweak(fill, dL*.05), pressed = tweak(fill, dL*.09);
  // disabled: platform-neutral, not brand (avoids a brand-coloured control looking enabled)
  const disabledBg = mode==='dark' ? '#243247' : '#E5E5E5', disabledFg = mode==='dark' ? '#6B7C93' : '#8A8A8A';
  // tints
  const k = hex2oklch(base);
  const subtle = oklch2hex({L: mode==='dark' ? .26 : .965, C: Math.min(k.C*.28,.05), h:k.h});
  const muted  = oklch2hex({L: mode==='dark' ? .32 : .92,  C: Math.min(k.C*.4,.07),  h:k.h});
  const onSubtle = reach(oklch2hex({L: mode==='dark' ? .88 : .38, C: Math.min(k.C*.8,.12), h:k.h}), subtle, MIN.text);
  // 4. boundary colour for outlined controls/focus-adjacent UI: >=3:1
  const border = reach(fill, P.surface, MIN.ui);
  Object.assign(out,{fill,hover,pressed,on:on.colour,text:txt,disabledBg,disabledFg,subtle,muted,onSubtle,border});
  // 5. assertions (these are what CI checks)
  const checks = [
    ['text on fill', on.colour, fill, MIN.text],
    ['text on hover', onColour(hover,mode).colour, hover, MIN.text],
    ['text on pressed', onColour(pressed,mode).colour, pressed, MIN.text],
    ['link text on surface', txt, P.surface, MIN.text],
    ['link text on page background', txt, P.surfaceBg, MIN.text],
    ['text on subtle tint', onSubtle, subtle, MIN.text],
    ['outline border on surface', border, P.surface, MIN.ui],
  ];
  out.checks = checks.map(([name,fg,bg,min]) => ({name:`${key} ${mode}: ${name}`, fg, bg, ratio:+contrast(fg,bg).toFixed(2), min, pass: contrast(fg,bg)>=min}));
  return out;
}
const info = (k,m,msg)=>({level:'info',token:k,mode:m,message:msg});
const warn = (k,m,msg)=>({level:'adjusted',token:k,mode:m,message:msg});

// ---------- structural validation (mirrors schema/tenant-theme.schema.json) ----------
export function validate(t){
  const errs=[]; const hexRe=/^#[0-9A-Fa-f]{6}$/;
  if(t.schemaVersion!==1) errs.push('schemaVersion must be 1');
  if(!/^[a-z0-9][a-z0-9-]{1,62}$/.test(t.tenantId||'')) errs.push('tenantId must be 2–63 chars of a-z, 0-9, hyphen');
  if(!t.branding?.schoolName || t.branding.schoolName.length>80) errs.push('branding.schoolName required, max 80 chars');
  if(!hexRe.test(t.colors?.primary||'')) errs.push('colors.primary must be #RRGGBB');
  if(t.colors?.accent && !hexRe.test(t.colors.accent)) errs.push('colors.accent must be #RRGGBB');
  const allowed=new Set(['schemaVersion','tenantId','version','branding','colors','typography','loginImage','email','plan','updatedAt']);
  Object.keys(t).forEach(k=>{ if(!allowed.has(k)) errs.push(`unknown top-level key "${k}" (locked tokens and raw CSS are not accepted)`); });
  if(t.plan?.customCss) errs.push('plan.customCss is not supported in v1');
  if(t.typography?.font && !['Inter','Source Sans 3','Noto Sans','Nunito Sans'].includes(t.typography.font)) errs.push('typography.font must be one of the approved list');
  return errs;
}

// ---------- compile ----------
export function compile(theme){
  const errors = validate(theme); if(errors.length) return {ok:false, errors};
  const notes=[]; const sets = {};
  const inputs = { primary: theme.colors.primary.toUpperCase(), accent: (theme.colors.accent||theme.colors.primary).toUpperCase() };
  for(const mode of ['light','dark']) for(const key of ['primary','accent']) (sets[mode] ??= {})[key] = deriveMode(inputs[key], mode, notes, key);
  const vars = mode => {
    const s = sets[mode], v = {};
    for(const key of ['primary','accent']){ const d=s[key];
      const n = key==='primary' ? 'action-primary' : 'action-accent';
      v[`--color-${n}`]=d.fill; v[`--color-${n}-hover`]=d.hover; v[`--color-${n}-pressed`]=d.pressed;
      v[`--color-${n}-disabled`]=d.disabledBg; const o = key; v[`--color-text-on-${o}`]=d.on; v[`--color-text-on-${o}-disabled`]=d.disabledFg;
      v[`--color-${n}-text`]=d.text; v[`--color-${n}-border`]=d.border;
      v[`--color-${n}-subtle`]=d.subtle; v[`--color-${n}-muted`]=d.muted; v[`--color-text-on-${o}-subtle`]=d.onSubtle; }
    return v; };
  const block = (sel, vars) => `${sel}{\n${Object.entries(vars).map(([k,v])=>`  ${k}:${v};`).join('\n')}\n}`;
  const id = theme.tenantId, ver = theme.version ?? 1;
  const css = [`/* tenant:${id} theme-version:${ver} schema:1 — generated, do not edit */`,
    block(`[data-tenant="${id}"]`, vars('light')),
    block(`[data-tenant="${id}"][data-theme="dark"]`, vars('dark')),
    `@media (prefers-color-scheme:dark){\n${block(`[data-tenant="${id}"][data-theme="system"]`, vars('dark')).replace(/^/gm,'  ')}\n}`].join('\n');
  const checks = ['light','dark'].flatMap(m => ['primary','accent'].flatMap(k => sets[m][k].checks));
  return { ok:true, css, notes, checks, allPass: checks.every(c=>c.pass), derived: sets };
}

// CLI
if (process.argv[1] && process.argv[1].endsWith('compile-theme.mjs') && process.argv[2]) {
  const theme = JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  const r = compile(theme);
  const outDir = path.resolve(path.dirname(process.argv[1]),'../generated');
  if(!r.ok){ console.error('INVALID THEME\n - '+r.errors.join('\n - ')); process.exit(1); }
  fs.writeFileSync(`${outDir}/${theme.tenantId}.css`, r.css+'\n');
  fs.writeFileSync(`${outDir}/${theme.tenantId}.report.json`, JSON.stringify({tenantId:theme.tenantId, allPass:r.allPass, notes:r.notes, checks:r.checks},null,1));
  console.log(`${theme.tenantId}: ${r.checks.filter(c=>c.pass).length}/${r.checks.length} checks pass, ${r.notes.length} notes`);
  if(!r.allPass) process.exit(2);
}
