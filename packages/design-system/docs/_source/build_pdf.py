import json,html,re,subprocess,sys
from playwright.sync_api import sync_playwright
E=html.escape
sem=json.load(open('tokens/semantic.tokens.json'))
def sw(h): return f'<span class="sw" style="background:{h}"></span>' if h.startswith('#') else ''
def tbl(head,rows,cls=''):
    return f'<table class="{cls}"><tr>'+''.join(f'<th>{h}</th>' for h in head)+'</tr>'+''.join('<tr>'+''.join(f'<td>{c}</td>' for c in r)+'</tr>' for r in rows)+'</table>'
def code(s): return '<pre>'+E(s.strip('\n'))+'</pre>'
def pill(t): 
    c={'Yes':'y','No':'n','Locked':'n','Derived':'d','Plan':'p'}.get(t.split()[0],'');return f'<span class="pl {c}">{t}</span>'
# ---- derived theme results
reports={t:json.load(open(f'generated/{t}.report.json')) for t in ['default-green','neon-pink','pale-sun']}
from itertools import groupby
def theme_block(tid,label,inp):
    r=reports[tid]; rows=[]
    for c in r['checks']:
        rows.append([E(c['name'].split(': ',1)[0]),E(c['name'].split(': ',1)[1]),f'{sw(c["fg"])}{c["fg"]}',f'{sw(c["bg"])}{c["bg"]}',f'{c["ratio"]:.2f}:1',f'≥ {c["min"]}','Pass' if c['pass'] else 'FAIL'])
    notes=''.join(f'<li><b>{E(n["level"])}</b> · {E(n["message"])}</li>' for n in r['notes'])
    return f'<h3>{label} <small>({inp})</small></h3>'+tbl(['Token / mode','Check','Foreground','Background','Ratio','Min','Result'],rows,'sm')+f'<p class="k">Messages shown to the tenant admin:</p><ul class="sm">{notes}</ul>'
# ---- semantic token appendix
def flat(d,path=()):
    for k,v in d.items():
        if k.startswith('$'): continue
        if '$value' in v and isinstance(v['$value'],dict): yield '-'.join(path+(k,)),v
        elif '$value' not in v: yield from flat(v,path+(k,))
sem_rows=[]
for n,v in flat(sem['color']):
    l,d=v['$value']['light'],v['$value']['dark']; own=v['$extensions']['edumyles']['tenant']
    sem_rows.append([f'<code>color-{n}</code>',sw(l)+E(l),sw(d)+E(d),pill({'locked':'Locked','derived':'Derived','input':'Yes (input)'}[own]),E(v.get('$description',''))])
# ---- override matrix
Y,N='Yes','No'
matrix=[
 ('Logo (light surface)',Y,'SVG (sanitised) or PNG. Max 512 KB. Min height 32 px on screen. 25% clear space.'),
 ('Logo (dark surface)',Y+' (optional)','If absent, the engine renders a single-colour (white) version of the light logo and warns if it is multi-colour.'),
 ('Logo mark (collapsed sidebar, avatar)',Y,'Square, min 128 × 128 px. Falls back to first letter of school name on primary.'),
 ('Favicon',Y,'PNG 512 × 512 source; the platform generates 32/64/192/512 and .ico.'),
 ('School name',Y,'1–80 characters. Always truncates with a tooltip, never wraps in the header.'),
 ('Primary colour (<code>color-action-primary</code>)',Y+' (input)','#RRGGBB. Validated at save time. Fill, hover, pressed, tints, text shade and dark-mode value are all derived (section 3).'),
 ('Accent colour (<code>color-action-accent</code>)',Y+' (input)','#RRGGBB, optional (defaults to primary). Used for highlights, charts series 2, secondary emphasis; never for status.'),
 ('Font family',Y+' (optional)','One of: Inter (default), Source Sans 3, Noto Sans, Nunito Sans. Self-hosted by the platform. No uploads in v1.'),
 ('Login page imagery',Y,'JPG/WebP ≤ 800 KB, min 1600 × 1200. Required alt text. Text over the image sits on a platform-controlled scrim so contrast never depends on the photo.'),
 ('Email template header logo and footer text',Y,'Logo PNG (email clients do not render SVG reliably) ≤ 200 KB, footer ≤ 300 chars plain text. Colours come from the derived palette.'),
 ('Appearance mode (light / dark / system)',N+' (per user)','Each user chooses. The tenant sets no default except "system".'),
 ('Error / danger, warning, success, info colours',N+' (locked)','Meaning must be identical on every tenant. Light and dark values are fixed.'),
 ('Focus ring',N+' (locked)','Platform blue (#0F4FA0 light, #6FA2F3 dark), 2 px ring + 2 px offset in the surface colour.'),
 ('Surface, text, border neutrals',N+' (locked)','Neutral palette only. Tenants colour actions, not backgrounds.'),
 ('Spacing scale, density values, radius',N+' (locked)','Fixed so layouts survive any theme.'),
 ('Minimum font sizes (12 px captions, 14 px body)',N+' (locked)','Fonts can change; size floors cannot.'),
 ('Layout grid, breakpoints, sidebar widths',N+' (locked)','256/72 px sidebar, 64 px header, 24/16 px page padding, 1600 px content max.'),
 ('Motion durations and reduced-motion behaviour',N+' (locked)','Respects <code>prefers-reduced-motion</code>.'),
 ('Remove "Powered by EduMyles" (full white-label)','Plan: Enterprise','Billing flag <code>plan.whiteLabel</code>. Tenant admin cannot set it.'),
 ('Custom domain',  'Plan: Growth and up','Billing flag <code>plan.customDomain</code>. DNS and TLS verified before activation. Theme resolves by host.'),
 ('Custom CSS','Not offered','Avoid entirely. Anything a tenant needs must become a token. If a contract demands it later: Enterprise only, scoped, linted, and excluded from support guarantees.'),
]
mrows=[[a,pill(b if not b.startswith('Yes') else 'Yes' ) if False else pill(b),c] for a,b,c in matrix]
# ---- components
SM='Spec'
comps=[
 ('Button','Variants: primary, secondary (outline), ghost, danger, link. Sizes: sm 32, md 40, lg 44, xl 48 px (compact density: 32 px md). Icon-leading/trailing, icon-only (square, needs aria-label).',
  'default; hover = <code>-hover</code>; focus = platform ring; active = <code>-pressed</code>; disabled = <code>-disabled</code> + <code>text-disabled</code> with <code>aria-disabled</code> (stays focusable inside forms); loading = spinner replaces icon, width locked, <code>aria-busy="true"</code>, click ignored; error n/a (use danger variant).',
  'color-action-primary(-hover/-pressed/-disabled/-border), color-text-on-primary, color-action-primary-text, color-focus-ring, color-status-danger-*, radius-control, control-height',
  'Label never wraps; truncates with ellipsis and tooltip at max-width 100% of container. Width grows with text (min 64 px). Allow +30% text expansion before truncation.',
  'Chevrons and leading/trailing icons swap sides. Icon-only buttons with directional icons mirror (arrows, chevrons) but not logos, clocks or media controls.',
  'Enter/Space activate. Native <code>&lt;button&gt;</code>. Loading announces via <code>aria-live="polite"</code> status text.'),
 ('Text field / Textarea','Variants: default, with prefix/suffix, with leading icon, password. Sizes sm/md/lg. Helper text, character counter.',
  'default; hover = border-strong darken; focus = ring + border-focus; disabled = sunken bg, text-disabled; error = danger border + icon + message (never colour alone) and <code>aria-invalid</code>; read-only; loading (async validation) shows inline spinner.',
  'color-surface-default, color-border-strong, color-focus-ring, color-status-danger-solid, color-text-muted (placeholder, helper), input-height, radius-control',
  'Label wraps up to 2 lines then truncates with tooltip; helper and error text always wrap. Placeholder is a hint, never the label.',
  'Text aligns to start. Numeric, email, URL and phone inputs stay LTR (<code>dir="ltr"</code>) inside RTL pages. Prefix/suffix swap sides.',
  'Label via <code>&lt;label for&gt;</code>; helper and error linked by <code>aria-describedby</code>; error summary moves focus on submit. Required = <code>required</code> plus visible "(required)" text.'),
 ('Select / Combobox','Single, multi, searchable, async. Sizes sm/md/lg.',
  'default, hover, focus, open, disabled, loading (listbox shows "Loading…" row), error, empty ("No results").',
  'surface-raised, border-default, action-primary-subtle (selected option), text-on-primary-subtle, elevation-popover',
  'Options truncate with tooltip; selected multi-values collapse into "+N" chip. Listbox min-width = trigger width, max 480 px.',
  'Caret mirrors; listbox aligns to the start edge; typeahead respects locale collation.',
  'ARIA 1.2 combobox: <code>role="combobox"</code>, <code>aria-expanded</code>, <code>aria-controls</code>, <code>aria-activedescendant</code>. Arrow keys move, Enter selects, Esc closes, Home/End jump, type to filter. Announce result count.'),
 ('Checkbox, Radio, Switch','Checkbox (incl. indeterminate), radio group, switch. Sizes md 20 px box, lg 24 px; hit area ≥ 44 × 44 px on touch.',
  'default, hover, focus, checked, disabled, error (group level), loading (switch pending).',
  'color-action-primary (checked fill), color-text-on-primary (tick), color-border-strong, color-focus-ring',
  'Label wraps beside the control, control aligned to first line.',
  'Control sits at the start edge; switch thumb travels toward the end edge (mirrors).',
  'Native inputs. Switch = <code>role="switch"</code> with <code>aria-checked</code>. Space toggles; arrows move within radio groups. Group has <code>fieldset/legend</code>.'),
 ('Tabs','Underline (default) and segmented. Horizontal only; scrolls with arrow buttons when overflowing.',
  'default, hover, focus, selected (indicator + text shade, not colour alone: 2 px indicator and weight 600), disabled.',
  'color-action-primary (indicator), color-action-primary-text, color-text-muted, color-border-default',
  'Labels never wrap; overflow scrolls. Tab min-width 72 px.',
  'Order and indicator mirror; scroll buttons swap.',
  '<code>tablist/tab/tabpanel</code>, roving tabindex, arrows move, Home/End, Enter/Space activate (manual activation for heavy panels). <code>aria-selected</code>.'),
 ('Dialog (modal) and Drawer','Dialog widths 400 / 520 / 720 / 960 px; drawer 480 px; full-screen on phones. Variants: default, confirm, destructive.',
  'default, focus trap, loading (primary action loading, rest inert), error (inline banner at top, focus moves to it).',
  'color-surface-raised, color-surface-overlay, elevation-dialog, radius-dialog, color-status-danger-* (destructive)',
  'Title wraps up to 3 lines; body scrolls inside the dialog; footer buttons stack on narrow widths with the primary action first.',
  'Close button and footer actions swap sides; drawer enters from the start edge for navigation, end edge for detail.',
  '<code>role="dialog"</code> (<code>alertdialog</code> for destructive), <code>aria-modal</code>, labelled by title; focus moves in, is trapped, returns to trigger on close; Esc closes unless a save is pending; background <code>inert</code>.'),
 ('Toast and Banner','Toast: info, success, warning, danger; 5 s default, persistent when it contains an action. Banner: page-level, dismissible, not auto-hiding.',
  'default, hover (pauses timer), focus within (pauses timer), dismissed, stacked (max 3).',
  'color-status-*-subtle/on-subtle/solid, elevation-popover, radius-card',
  'Message wraps up to 4 lines, then "Show more". Never truncate an error.',
  'Anchors bottom-start; icon and close mirror.',
  '<code>role="status"</code> (<code>alert</code> for danger), <code>aria-live</code>. Icon + text always (not colour alone). Reduced motion: fade only.'),
 ('Data table','Sortable, selectable, expandable rows; sticky header and first column; density comfortable (48 px rows) and compact (36 px). Virtualised above 200 rows.',
  'default, row hover, row focus, selected (<code>action-primary-subtle</code> + checkbox), disabled row, loading (skeleton rows, <code>aria-busy</code>), empty, error (retry row).',
  'color-surface-sunken (header), color-border-default, color-action-primary-subtle, text-on-primary-subtle, row-height',
  'Cells truncate with tooltip; user may toggle wrap. Column min 80 px. Numeric columns right-aligned with tabular numerals.',
  'Column order, sort arrows, sticky column (start edge), and checkbox column mirror. Numbers and currency stay LTR.',
  '<code>&lt;table&gt;</code> semantics, <code>scope</code>, <code>aria-sort</code>, caption; grid role only when cells are interactive. Arrow-key navigation in grid mode, Enter to open row, Space to select. Announce sort and selection counts.'),
 ('Badge and Status chip','Neutral, brand, status (success, warning, danger, info). Sizes sm 20, md 24 px. Always icon + label for status.',
  'default; interactive chips: hover, focus, pressed, disabled.',
  'color-status-*-subtle / on-subtle, color-action-primary-subtle, radius-badge',
  'Single line, truncates at 24 characters with tooltip. Never wrap.',
  'Icon sits at the start edge.',
  'Static badges are text (no role). Counts use <code>aria-label</code> ("12 unread"). Status conveyed in text, not colour.'),
 ('Card','Static, interactive (whole card is a link), selectable. Padding 24 px (comfortable), 16 px (compact).',
  'default, hover (shadow-md), focus, selected, disabled, loading (skeleton), error.',
  'color-surface-default, color-border-default, elevation-card, radius-card',
  'Title clamps to 2 lines, body to 3 lines (configurable). Footer actions wrap.',
  'Content mirrors; media stays at start edge.',
  'Interactive cards use a single real link on the title with a stretched hit area, not <code>role="button"</code> on a div.'),
 ('Sidebar navigation','Expanded 256 px, collapsed 72 px (mark only), mobile drawer. Groups, badges, external-link marker.',
  'default, hover (surface-sunken), focus, active (<code>action-primary-subtle</code> + 3 px indicator + <code>aria-current="page"</code>), disabled.',
  'color-action-primary(-subtle), text-on-primary-subtle, tenant logo/mark, color-chrome-platform (platform admin only)',
  'Labels truncate with tooltip at 20 characters; collapsed state shows tooltip on focus and hover.',
  'Sidebar docks to the end edge in RTL; indicator mirrors; chevrons mirror.',
  '<code>&lt;nav aria-label&gt;</code>, lists, groups as <code>aria-labelledby</code> headings, <code>aria-current</code>, skip link first on page. Collapse button is a real button with <code>aria-expanded</code>.'),
 ('Tenant logo and Avatar','Logo lockup (horizontal), mark, avatar (initials fallback), avatar group. Logo height 32–40 px in header.',
  'default, loading (skeleton), error (image failed → school name text), disabled n/a.',
  'color-action-primary + color-text-on-primary (initials fallback), color-border-default',
  'School name beside logo truncates; logo never stretches (object-fit: contain).',
  'Logo does not mirror. Placement follows the start edge.',
  'Logo link: <code>alt="{School name} home"</code>. Decorative duplicates use <code>alt=""</code>. Avatar initials exposed as text.'),
 ('Tooltip and Popover','Tooltip: short text, no interactive content. Popover: interactive, anchored, dismissible.',
  'default, open on hover and focus, delayed 400 ms, dismissible with Esc.',
  'color-text-inverse, surface inverse, elevation-popover, z-tooltip',
  'Max-width 280 px, wraps. Never the only place a critical label lives.',
  'Placement flips with direction.',
  'Tooltip: <code>role="tooltip"</code> + <code>aria-describedby</code>. Popover: focusable content, Esc closes, focus returns to trigger.'),
 ('Pagination, Empty state, Skeleton','Pagination (numbered, compact on phones), empty state (icon, title, action), skeleton (shimmer disabled under reduced motion).',
  'default, hover, focus, current page, disabled, loading.',
  'color-action-primary-subtle (current), color-surface-sunken (skeleton), color-text-muted',
  'Page buttons keep 44 px hit area; empty-state copy wraps and is centred.',
  'Prev/next arrows and numbering direction mirror (numerals stay in locale script).',
  'Pagination in <code>&lt;nav aria-label="Pagination"&gt;</code>, current = <code>aria-current="page"</code>. Skeleton regions are <code>aria-hidden</code> with a single live "Loading" status.'),
]
comp_html=''
for n,v,st,tk,lt,rtl,kb in comps:
    comp_html+=f'''<div class="comp"><h3>{n}</h3><table class="cs"><tr><th>Variants and sizes</th><td>{v}</td></tr><tr><th>States</th><td>{st}</td></tr><tr><th>Tokens consumed</th><td class="m">{tk}</td></tr><tr><th>Long and translated text</th><td>{lt}</td></tr><tr><th>RTL</th><td>{rtl}</td></tr><tr><th>Keyboard, ARIA, screen reader</th><td>{kb}</td></tr></table></div>'''
CSSDOC='''
@page{size:A4;margin:15mm 13mm}
*{box-sizing:border-box}body{font:10.5px/1.5 Inter,"Helvetica Neue",Arial,sans-serif;color:#10201C;margin:0}
h1{font-size:30px;letter-spacing:-.02em;margin:0 0 6px}h2{font-size:18px;margin:0 0 8px;padding:6px 0;border-bottom:2px solid #1565C0;break-after:avoid}h3{font-size:12.5px;margin:14px 0 5px;break-after:avoid}h3 small{font-weight:400;color:#5A6B66}
h2.part{page-break-before:always}p{margin:4px 0 8px;color:#2D3B37}.k{font-weight:600;margin:8px 0 3px}ul{margin:3px 0 8px;padding-left:18px}li{margin:2px 0}
table{width:100%;border-collapse:collapse;margin:4px 0 10px}th,td{padding:4px 6px;border-bottom:1px solid #DDE4E1;text-align:left;vertical-align:top}th{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#5A6B66;background:#F3F6F5}tr{break-inside:avoid}
table.sm td,table.sm th{font-size:9px;padding:3px 5px}ul.sm{font-size:9px}table.cs th{width:104px;text-transform:none;letter-spacing:0;font-size:9.5px;color:#10201C;background:#F3F6F5}table.cs td{font-size:9.5px}.m{font-family:Menlo,Consolas,monospace;font-size:8.8px}
code{font-family:Menlo,Consolas,monospace;font-size:9px;background:#EEF3F1;padding:0 3px;border-radius:3px}pre{background:#0B111C;color:#E2E8F0;padding:9px 11px;border-radius:8px;font:8.6px/1.45 Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-word;margin:5px 0 10px;break-inside:avoid}
.sw{display:inline-block;width:12px;height:12px;border-radius:3px;border:1px solid rgba(0,0,0,.25);margin-right:4px;vertical-align:-2px}
.cover{background:#0B111C;color:#F8FAFC;border-radius:16px;padding:34px 32px;margin-bottom:14px}.cover p{color:#A3B1C2}.cover .eb{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#6FA2F3}
.pl{display:inline-block;padding:1px 7px;border-radius:99px;font-size:9px;font-weight:600;background:#E5E7EB;white-space:nowrap}.pl.y{background:#DCFCE7;color:#14532D}.pl.n{background:#FDE8E8;color:#8E1B1B}.pl.d{background:#E1EEFF;color:#0B3B78}.pl.p{background:#FFF1D6;color:#7A3E00}
.box{background:#F1F6F4;border-radius:10px;padding:9px 12px;margin:8px 0}.rule{border-left:4px solid #1565C0;background:#EEF4FF;padding:7px 11px;border-radius:0 8px 8px 0;margin:8px 0}.comp{break-inside:avoid}
.tier{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:8px 0}.tier>div{border:1px solid #CBD5D1;border-radius:10px;padding:9px 11px}.tier b{display:block;font-size:11.5px;margin-bottom:3px}
ol li{margin:3px 0}.checks li{list-style:none;margin-left:-14px}.checks li:before{content:"\\2610  ";}
'''
def tiers():
    return '''<div class="tier"><div><b>Tier 1 · Primitive</b>Raw values: <code>color.blue.600</code>, <code>space.4</code>, <code>radius.md</code>, <code>font.size.body</code>.<br><br><i>Tenants never touch these. Components never reference them.</i></div><div><b>Tier 2 · Semantic</b>Meaning: <code>color-action-primary</code>, <code>color-surface-default</code>, <code>color-text-muted</code>, <code>color-status-danger-solid</code>.<br><br><i>Components consume only this tier. Tenants override a small slice of it, through brand inputs.</i></div><div><b>Tier 3 · Component (optional)</b><code>button-primary-bg</code>, <code>table-row-selected</code>, <code>nav-item-bg-active</code>. Defaults to a semantic token.<br><br><i>Used for fine control. Same override rules as tier 2: not tenant-overridable.</i></div></div>'''
B=[]
B.append(f'''<div class="cover"><div class="eb">EduMyles · MylesCorp Technologies</div><h1>Design system and theming architecture</h1><p>Token architecture, tenant override contract, accessibility guardrails, theme delivery, component specifications, localisation, governance and QA. Prepared for Myles (Jonathan Ayany). Version 1.0 · 2 November 2026.</p></div>
<h3>What is in the package</h3>{tbl(['Handoff deliverable','Where'],[
['Token spec (JSON plus documentation)','Sections 1 and appendix A · <code>tokens/primitives|semantic|component.tokens.json</code> · <code>generated/platform-default.css</code>'],
['Tenant override matrix','Section 2'],
['Theme JSON schema and validation rules','Section 4 · <code>schema/tenant-theme.schema.json</code> · <code>tools/compile-theme.mjs</code> · <code>tools/theme.test.mjs</code>'],
['Component specs and Storybook with theme switching','Section 5 · <code>storybook/preview.tsx</code>'],
['Accessibility checklist','Section 9.1'],
['Email and PDF template theming rules','Section 9.2'],
['Versioning and governance doc','Section 7'],
['Worked example: three test themes, compiled and checked','Section 3.4 · <code>generated/*.css</code> and <code>*.report.json</code>']])}
<div class="rule"><b>Decisions this document builds on</b> (from the EduMyles design system v1.0): premium enterprise look; neutral surfaces with a tenant-coloured action layer; Inter by default; status colours and focus ring owned by the platform; appearance mode is a per-user setting; dark mode derived, never inverted. Where the v1.0 brief limited tenants to name, logo, favicon, primary and accent, this document keeps those as the v1 launch set and lists the rest (fonts, login image, email header/footer) as optional extensions that use the same pipeline. Platform values follow the shell and your screenshots exactly: dark background <b>#0B111C</b> (the v1.0 token file said #0F1623), light page background <b>#F4F4F5</b> (said #FAFAFA) and light muted <b>#F1F1F2</b> (said #F5F5F5).</div>''')
B.append('<h2 class="part">1. Token architecture in three tiers</h2>'+tiers()+'''
<h3>1.1 Rules</h3><ul>
<li><b>No hard-coded hex in a component.</b> Everything resolves through semantic tokens. Enforce with a lint rule (stylelint <code>color-no-hex</code> outside <code>tokens/</code> and <code>generated/</code>, plus an ESLint rule on style objects) and a CI check that every component token resolves to a semantic or primitive reference.</li>
<li><b>Names describe role, not appearance.</b> <code>color-action-primary</code>, never <code>color-green</code>. A tenant whose primary is red must not make a token called "green" lie.</li>
<li><b>Pattern:</b> <code>{category}-{role}[-{variant}][-{state}]</code>, kebab-case. Examples: <code>color-surface-raised</code>, <code>color-action-primary-hover</code>, <code>color-text-on-primary</code>, <code>color-status-danger-subtle</code>.</li>
<li><b>Modes live in the value, not the name.</b> Each semantic colour has a light and a dark value (<code>$value.light</code>, <code>$value.dark</code>). Components never branch on mode.</li>
<li><b>Pairs, not singles.</b> Every fill has an "on" token (<code>text-on-primary</code>, <code>status-danger-on-solid</code>) so a theme can never change a background without changing its text.</li>
<li><b>Tenants only ever supply brand inputs.</b> The theme engine writes the derived semantic values (section 3). A component cannot tell a tenant value from a platform value.</li></ul>
<h3>1.2 Example: one value through three tiers</h3>'''+code('''// tier 1 — primitive
"color.blue.600": "#1565C0"

// tier 2 — semantic (platform default; tenant brand input replaces the source)
"color-action-primary": { "light": "{color.blue.600}", "dark": "{color.blue.300}" }
"color-text-on-primary": { "light": "#FFFFFF",          "dark": "{color.blue.900}" }

// tier 3 — component (optional)
"button-primary-bg": "{color-action-primary}"
"button-primary-fg": "{color-text-on-primary}"

/* what a component writes */
.btn-primary{ background:var(--color-action-primary); color:var(--color-text-on-primary);
              border:1px solid var(--color-action-primary-border); }
.btn-primary:hover{ background:var(--color-action-primary-hover); }''')+'''
<h3>1.3 Other token families</h3>'''+tbl(['Family','Tier 1 primitives','Tier 2 semantic'],[
['Space','<code>space-0 … 20</code> on a 4 px base (0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80)','<code>space-inline</code> 8, <code>space-stack</code> 16, <code>space-inset</code> 16, <code>space-gutter</code> 24, <code>space-section</code> 48'],
['Radius','none 0, xs 4, sm 6, md 8, lg 12, xl 16, 2xl 20, full','<code>radius-control</code> 8, <code>radius-card</code> 12, <code>radius-dialog</code> 16, <code>radius-badge</code> 6'],
['Type','Inter stack; sizes 12/13/14/16/20/24/32; weights 400/500/600/700','<code>font-family-sans</code> (tenant: approved list), <code>font-size-min</code> 12 locked; roles display, h1–h4, body, label, button'],
['Elevation','shadow xs–xl','<code>elevation-card</code> sm, <code>elevation-popover</code> md, <code>elevation-dialog</code> xl'],
['Motion','100 / 150 / 200 / 300 ms; standard and exit easings','<code>motion-fast</code> 150 (hover, focus), <code>motion-normal</code> 200 (open/close). Zero under reduced motion'],
['Density','control 32 / 40 / 44 / 48; row 36 / 48','<code>density-comfortable</code> and <code>density-compact</code> sets, switched by <code>[data-density]</code>'],
['Layout and z-index','breakpoints 640/768/1024/1280/1600; sidebar 256/72; header 64/56','z: base 0, sticky 100, dropdown 200, overlay 300, modal 400, toast 500, tooltip 600']])+'''
<h3>1.4 Dark-mode values for the platform defaults</h3><p>Dark values are authored, not computed by inversion: background <code>#0B111C</code>, card <code>#172235</code>, text <code>#F8FAFC</code>, muted text <code>#A3B1C2</code>, border <code>#2B3A4F</code>, form border <code>#6B7C93</code>, ring <code>#6FA2F3</code>. Elevation in dark mode uses lighter surfaces and 1 px borders instead of shadows. The full table is in appendix A.</p>''')
B.append('<h2 class="part">2. The tenant override contract</h2><p>Tenants supply a small set of <b>brand inputs</b>. Everything else is derived or locked. The table is the contract: if a token is not marked overridable, no UI, API or support process may change it for a single tenant.</p>'+tbl(['Token / capability','Overridable by tenant','Constraints'],mrows)+'''
<h3>2.1 The five launch inputs</h3><p>At launch the tenant admin form exposes: school name, logo (plus optional dark logo), favicon, primary colour, accent colour. Font, login image, and email header/footer are optional extensions on the same schema; they ship when the matching preview and validation exist.</p>
<h3>2.2 Why tenants cannot produce an inconsistent theme</h3><ul><li>One input colour becomes about 20 semantic values (fill, hover, pressed, disabled, text shade, border, three tints, on-colours, dark equivalents). Tenants never pick hover or tint colours.</li><li>Neutrals and status colours are locked, so a "danger" button looks the same on every tenant and an error is never mistaken for a brand colour.</li><li>The schema rejects any key it does not know (<code>additionalProperties: false</code>), so locked tokens and raw CSS cannot be smuggled in.</li><li>Every derived pair is contrast-checked at save time and again in CI against three reference themes.</li></ul>''')
B.append('<h2 class="part">3. Accessibility guardrails on tenant input</h2><h3>3.1 Rules checked at save time</h3>'+tbl(['Check','Minimum','What it protects'],[
['Label text on primary and accent fills (default, hover, pressed)','4.5:1','Button and badge labels'],
['Primary text shade on page and card (links, outline buttons, selected tab labels)','4.5:1','Links and text-coloured controls'],
['Text on subtle tint (selected row, soft badge)','4.5:1','Tables, navigation, badges'],
['Control border against the surface (outline buttons, chips)','3:1','Edges of controls (WCAG 1.4.11)'],
['Dark-mode fill against dark surface','3:1','Visible controls in dark mode'],
['Dark-mode text pairs','4.5:1','All of the above in dark mode']])+'''
<h3>3.2 What the system does when a brand colour fails</h3><p>It never rejects a brand colour outright and never lets a failing pair reach production. It corrects the <i>supporting</i> value and keeps the brand identity wherever possible, then tells the admin in plain words what changed and why.</p><ol>
<li><b>Choose the label colour.</b> Use white if it reaches 4.5:1 on the fill, otherwise ink (#171717 in light, #082A56 in dark). One of the two always reaches 4.5:1, so the fill itself can stay the brand colour.</li>
<li><b>Fix state colours in the safe direction.</b> Hover and pressed darken under white text and lighten under dark text, so label contrast never drops below the minimum.</li>
<li><b>Add a text shade.</b> If the brand colour is too light to be used as link text, a darker shade of the same hue (<code>color-action-primary-text</code>) is used for text and outline buttons.</li>
<li><b>Add a control edge.</b> If the fill is under 3:1 against the page (pale yellow, light mint), the fill stays and controls get a darker border of the same hue (<code>color-action-primary-border</code>).</li>
<li><b>Show the admin the result.</b> The preview lists each adjustment, and publishing is allowed. Example: "White text on #F2E27A is only 1.32:1, so text on this colour is dark (13.6:1). Your colour is kept."</li></ol>
<div class="rule"><b>Dark mode is derived, not inverted.</b> The brand hue is kept, lightness is raised to at least 72% so the fill is at least 3:1 on #172235, chroma is reduced slightly to avoid glare, tints are rebuilt at low lightness, and every pair is checked again. Platform surfaces use the authored dark palette.</div>
<h3>3.3 Derivation recipe (reference implementation: <code>tools/compile-theme.mjs</code>)</h3>'''+tbl(['Output','Light mode','Dark mode'],[
['fill','Brand colour as entered','Brand hue, lightness ≥ 72% (max 82%), chroma × 0.92, then raised until ≥ 3:1 on surface'],
['text-on-fill','White if ≥ 4.5:1, else ink #171717','White if ≥ 4.5:1, else navy #082A56'],
['hover / pressed','Lightness −0.05 / −0.09 (under white text) or +0.05 / +0.09 (under dark text)','Same rule'],
['disabled','Neutral #E5E5E5 fill, #8A8A8A text (not brand-coloured)','Neutral #243247 fill, #6B7C93 text'],
['text shade','Brand shifted darker until ≥ 4.5:1 on #FFFFFF and #F4F4F5','Shifted lighter until ≥ 4.5:1 on #172235 and #0B111C'],
['border','Brand, darkened until ≥ 3:1 on surface','Same'],
['subtle / muted tint','L 96.5% / 92%, chroma ≤ 0.05 / 0.07','L 26% / 32%'],
['text on subtle','L 38% of brand hue, adjusted to ≥ 4.5:1','L 88%, adjusted to ≥ 4.5:1']])+'''<p>Colour maths uses OKLCH (perceptually even lightness) with gamut mapping to sRGB; contrast uses the WCAG 2.x relative-luminance formula. APCA can be added later as an advisory metric, not a gate.</p>
<h3>3.4 Worked results: three reference themes</h3><p>All 84 assertions pass (28 per theme, light and dark, primary and accent). These are the same three themes used for visual regression in section 8.</p>'''+theme_block('default-green','Theme A: default','primary #2E7D32, accent #C79639')+theme_block('neon-pink','Theme B: high-saturation brand','primary #FF1493, accent #00E5FF')+theme_block('pale-sun','Theme C: low-contrast edge case','primary #F2E27A, accent #CFE8E0'))
B.append('<h2 class="part">4. Delivery mechanism</h2><h3>4.1 The theme document</h3><p>A theme is a JSON document per tenant, versioned and validated against <code>schema/tenant-theme.schema.json</code> (JSON Schema 2020-12). It holds brand inputs only.</p>'+code(open('examples/default.theme.json').read())+'''
<h3>4.2 Validation rules</h3>'''+tbl(['Rule','Behaviour'],[
['Structure','Schema-valid, <code>additionalProperties: false</code> at every level. Unknown keys, locked tokens and raw CSS are rejected with the key name in the error.'],
['Colours','Exactly <code>#RRGGBB</code>. Named colours, <code>rgb()</code>, alpha and gradients are rejected.'],
['Font','Must be one of the approved list. No uploads or URLs.'],
['URLs','Same-origin path or <code>https://</code> only. <code>javascript:</code>, <code>data:</code> and protocol-relative URLs rejected. Assets are re-hosted by the platform; the stored URL is always ours.'],
['Logo files','SVG: sanitised server-side (remove script, foreignObject, event handlers, external references; keep viewBox; flatten transforms). PNG/WebP accepted with size limits. Reject if the sanitiser changes more than 5% of nodes and ask for a different file.'],
['Contrast','Run the compiler. Any assertion that cannot be fixed by derivation blocks publishing (none occur for valid hex colours; the guard exists for future token additions).'],
['Version','Server increments <code>version</code> on publish. Clients cannot set it.']])+'''
<h3>4.3 Compile to CSS custom properties</h3><p>The server compiles the theme to a CSS block scoped by tenant attribute. The same output works as a <code>:root</code> injection on a custom domain.</p>'''+code(open('generated/default-green.css').read()[:1750]+'  /* … */\n}')+'''
<h3>4.4 Resolve before first paint</h3><ol>
<li><b>Resolve the tenant early:</b> from host (custom domain or subdomain) or from the authenticated session, in edge middleware.</li>
<li><b>Inline the CSS:</b> the server renders <code>&lt;style id="tenant-theme"&gt;</code> in the document head and sets <code>data-tenant</code> on <code>&lt;html&gt;</code>. No client fetch before paint.</li>
<li><b>Set the mode before paint:</b> a 400-byte inline script in the head reads the stored mode (cookie first so the server can render it, then localStorage), sets <code>data-theme</code> and <code>color-scheme</code>. System mode uses the <code>prefers-color-scheme</code> media block already inside the compiled CSS.</li>
<li><b>Preload brand assets:</b> <code>&lt;link rel="preload"&gt;</code> for the logo and the tenant font file; <code>font-display: swap</code> with a size-adjusted fallback to avoid layout shift.</li>
<li><b>Cache:</b> key <code>theme:{tenantId}:v{version}</code>. CDN responses carry <code>Cache-Control: public, max-age=31536000, immutable</code> when the URL contains the version. The page references the versioned URL, so a publish changes the URL and no purge is needed. Server-side cache is invalidated explicitly on publish; the previous version is kept for 24 hours for rollback.</li>
<li><b>Fallback:</b> if the theme is missing, invalid, or fails to compile, serve <code>platform-default.css</code> (the platform blue default) and log an alert. A tenant is never shown an unstyled or half-themed page. A cached last-known-good theme is preferred over the platform default for up to 7 days.</li></ol>'''+code('''<!doctype html>
<html lang="en" data-tenant="greenfield" data-theme="light" data-density="comfortable" dir="ltr">
<head>
  <style id="platform-tokens">/* platform-default.css, inlined critical subset */</style>
  <style id="tenant-theme">/* [data-tenant="greenfield"]{…} generated, version 7 */</style>
  <script>/* sets data-theme from cookie/localStorage before paint */</script>
  <link rel="preload" as="image" href="/tenants/greenfield/logo.svg?v=7">
</head>''')+'''
<h3>4.5 Publish flow</h3><ol><li>Admin edits inputs; the preview recompiles in the browser (the compiler is isomorphic).</li><li>Preview shows adjustment messages and three live panels: light, dark, and a screen-reader-order list of the key components.</li><li>Publish → server re-validates and re-compiles (never trusts the client output) → writes version N+1 → invalidates caches → records an audit entry (who, when, before/after inputs).</li><li>Rollback to any of the last 10 versions from the same screen.</li></ol>''')
B.append('<h2 class="part">5. Component library specification</h2><h3>5.1 Shared state model</h3><p>Every interactive component implements these states with the same tokens, so a theme change affects them consistently.</p>'+tbl(['State','Visual rule','Token / implementation'],[
['Default','Resting appearance','semantic token for the variant'],
['Hover','Fill moves one step (hover token); text controls gain <code>surface-sunken</code>','<code>-hover</code> tokens; only on <code>(hover:hover)</code> devices'],
['Focus (keyboard)','2 px ring, 2 px offset in surface colour, always visible, never removed','<code>color-focus-ring</code> (locked platform blue), <code>:focus-visible</code>'],
['Active / pressed','Fill moves two steps (pressed token); no scale transform','<code>-pressed</code> tokens'],
['Disabled','Neutral fill and text, not brand-coloured; no hover or pointer','<code>-disabled</code> tokens, <code>aria-disabled</code> or <code>disabled</code>; contrast exempt but still legible'],
['Loading','Spinner (or skeleton), width locked, input ignored, announced once','<code>aria-busy</code>, polite status; spinner uses current text colour'],
['Error','Danger colour <b>plus</b> icon <b>plus</b> message text','<code>status-danger-*</code>, <code>aria-invalid</code>, <code>aria-describedby</code>']])+'''
<h3>5.2 Density modes</h3><p>Density is a token set switched by <code>[data-density]</code> (user preference, not tenant). <b>Comfortable:</b> controls 40 px, rows 48 px, horizontal padding 16 px. <b>Compact:</b> controls 32 px, rows 36 px, padding 12 px. Touch targets stay at least 44 × 44 px effective in both (padding or pseudo-element extends the hit area). Font sizes do not change with density.</p>
<h3>5.3 Cross-cutting rules</h3><ul><li><b>Long text:</b> design for +30% expansion (German, Swahili, Arabic) and for 80-character school names. Buttons and tabs truncate with a tooltip; labels, helper text and errors wrap. Never clip an error.</li><li><b>RTL:</b> use CSS logical properties only (<code>margin-inline-start</code>, <code>inset-inline-end</code>, <code>text-align: start</code>). Mirror directional icons; do not mirror logos, numerals, clocks, charts' time axes, or media controls. Test every component in RTL in Storybook.</li><li><b>Keyboard:</b> every function reachable by keyboard, logical order, no traps except modals (which trap and restore focus).</li><li><b>Reduced motion:</b> transitions become opacity-only, ≤ 100 ms; no parallax or auto-play.</li><li><b>Forced colours:</b> borders and focus indicators use system colours (<code>forced-color-adjust</code> left default) so controls remain visible in Windows High Contrast.</li></ul>
<h3>5.4 Component specifications</h3>'''+comp_html)
B.append('<h2 class="part">6. Typography, localisation and iconography</h2><h3>6.1 Typography</h3>'+tbl(['Topic','Rule'],[
['Default stack','<code>Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif</code>. Tabular numerals (<code>font-variant-numeric: tabular-nums</code>) for money, counts, dates and IDs.'],
['Approved tenant fonts','Inter (default), Source Sans 3, Noto Sans, Nunito Sans. All have wide Latin coverage; Noto Sans is the fallback for scripts they lack (Arabic, Devanagari etc. use Noto Sans Arabic / Devanagari).'],
['Loading','Self-hosted WOFF2 subsets, variable weight 400–700 only. <code>font-display: swap</code>; preload the regular weight; use <code>size-adjust</code>, <code>ascent-override</code> on the fallback face to keep layout shift near zero. Max 2 families on a page (system + one).'],
['Scale','display 32/40, h1 24/32, h2 20/28, h3 16/24, h4 14/20, body 14/22, body-large 16/24, body-small 13/20, caption 12/16, label 12/16 500, button 14/20 500.'],
['Floors (locked)','Body ≥ 14 px, caption/label ≥ 12 px. Browser zoom to 200% and text-only zoom to 200% must not clip or overlap. Use <code>rem</code> for type, <code>px</code> only for borders.'],
['Line length','45–80 characters for reading content; tables exempt.']])+'''
<h3>6.2 Tenant logos and imagery</h3>'''+tbl(['Asset','Formats','Limits','Rules'],[
['Logo (horizontal)','SVG (sanitised), PNG','≤ 512 KB; SVG ≤ 100 KB; min 480 px wide for PNG; aspect 2:1 to 6:1','Shown at 32–40 px height. Provide a dark-surface version, or the engine renders a one-colour white version and warns if the logo has more than one colour. Clear space = 25% of logo height on every side. Minimum rendered height 24 px.'],
['Mark (square)','SVG, PNG','≥ 128 × 128 px, aspect 1:1','Collapsed sidebar, avatar, "Powered by" replacement. Fallback: first letter on <code>action-primary</code>.'],
['Favicon','PNG','512 × 512 source','Platform generates 32, 64, 192, 512 and .ico; transparent background allowed.'],
['Login image','JPG, WebP','≥ 1600 × 1200, ≤ 800 KB, focal point','Alt text required. Text sits on a platform scrim (surface-overlay) so contrast never depends on the photo.'],
['Email header logo','PNG only','≤ 200 KB, 2× for 600 px email width','Hosted on the platform CDN; never inlined.']])+'''
<h3>6.3 Iconography</h3><ul><li>One icon set (outline, 24 px grid, 1.75 px stroke, round caps), shipped as inline SVG using <code>currentColor</code> so icons follow text tokens.</li><li>Sizes 16, 20, 24 px. Icons never carry meaning alone: pair with text or <code>aria-label</code>. Decorative icons are <code>aria-hidden="true"</code>.</li><li>No emoji as icons. Directional icons have an RTL variant; brand and media icons do not mirror.</li></ul>
<h3>6.4 Localisation</h3><ul><li><b>Locales at launch:</b> en-KE, en-UG, en-TZ, sw. Layouts are verified for ar and fr as stress tests (RTL and long text).</li><li><b>Formatting:</b> use <code>Intl.DateTimeFormat</code>, <code>Intl.NumberFormat</code>, <code>Intl.PluralRules</code> and <code>Intl.ListFormat</code> only. Never concatenate translated fragments. Currency is formatted with the tenant's currency code (KES, UGX, TZS, USD), with the minor-unit digits of that currency (UGX and TZS commonly 0).</li><li><b>Time:</b> store UTC, display in the tenant time zone (Africa/Nairobi, Kampala, Dar es Salaam), with the zone shown on schedules and deadlines.</li><li><b>Expansion:</b> every layout tolerates +30% text length; buttons and tabs truncate, never overlap. Storybook has a text-expansion toolbar (×1, ×1.3, ×1.6) that pseudo-localises strings.</li><li><b>Bidirectional text:</b> user-supplied names and numbers are wrapped in <code>&lt;bdi&gt;</code>; <code>dir="auto"</code> on free-text inputs.</li><li><b>Language attribute:</b> <code>lang</code> on <code>&lt;html&gt;</code> and on any inline passage in another language.</li></ul>''')
B.append('<h2 class="part">7. Governance and versioning</h2><h3>7.1 Single source of truth</h3><p>The three <code>*.tokens.json</code> files (W3C Design Tokens format, <code>$value</code>, <code>$type</code>, per-mode values) are the only place a token is defined. Style Dictionary (or Tokens Studio exporting the same JSON) builds every target in CI from that source: CSS custom properties, TypeScript constants, Android <code>colors.xml</code>, iOS Swift, and a flat JSON for email and PDF templates (config in <code>tools/style-dictionary.config.json</code>). Generated files are committed to <code>build/</code> only in release tags and are never edited by hand.</p><h3>7.2 Semantic versioning</h3>'+tbl(['Change','Version bump','Examples'],[
['Breaking','MAJOR','Removing or renaming a semantic token; changing a token\'s meaning; changing a locked value so contrast or layout changes materially; changing the theme schema in a way old themes cannot satisfy.'],
['Additive','MINOR','New token, new component, new optional schema field, new approved font.'],
['Fix','PATCH','Bug fix, contrast correction that keeps the token name and intent, docs.']])+'''
<p>The <b>theme schema</b> carries its own <code>schemaVersion</code>. The engine supports the current and previous schema version at any time and migrates stored themes on read.</p>
<h3>7.3 Deprecation policy</h3><ol><li>Mark the token <code>$deprecated: true</code> with the replacement and a removal version; lint warns on use.</li><li>Keep it working for at least <b>two minor releases and 90 days</b>, whichever is longer.</li><li>Publish a migration note (what changed, search-and-replace map, codemod if possible) in the release notes.</li><li>Remove only in a MAJOR release. Telemetry on token usage confirms nothing in production still uses it.</li></ol>
<h3>7.4 Change process</h3>'''+tbl(['Step','Who','Output'],[
['Proposal (RFC, one page: problem, tokens affected, tenant impact, contrast evidence)','Any engineer or designer','Issue labelled <code>ds-rfc</code>'],
['Review','Design system owners: 1 design lead, 1 frontend lead, 1 accessibility reviewer (all three sign off for a new semantic token or any locked-value change)','Approve / revise'],
['Implementation','Proposer','PR touching only <code>tokens/</code> plus generated output and tests'],
['CI gates','Automated','Schema, token lint, contrast tests, visual regression on 3 themes × 2 modes × 2 directions, axe'],
['Release','Release owner','Tagged version, changelog, migration notes'],
['Tenant communication','Product / support','For anything that changes how a tenant theme renders: in-app notice and email ≥ 30 days before a MAJOR, tenant admins get a before/after preview, and themes are re-validated automatically with failures listed per tenant']])+'''
<h3>7.5 Breaking changes and tenants</h3><p>Tenant themes store inputs, not derived values, so most system changes (new tint algorithm, new state colour) reach tenants automatically at the next compile. The theme version stays the same for the tenant but the compiled artefact has its own <code>engineVersion</code> in the cache key (<code>theme:{tenantId}:v{themeVersion}:e{engineVersion}</code>). Locked colour changes apply to everyone at once and ship only in a MAJOR with notice.</p>''')
B.append('<h2 class="part">8. Testing and QA</h2>'+tbl(['Layer','What runs','Gate'],[
['Unit','Compiler assertions on the three reference themes (<code>node --test tools/theme.test.mjs</code>): every contrast pair passes; invalid inputs rejected; faint colours produce messages','Blocks merge'],
['Schema','Valid and invalid fixtures validated against the JSON Schema (good: 3 reference themes; bad: locked colour, bad hex, raw CSS, unapproved font, javascript: URL)','Blocks merge'],
['Token lint','No literal hex outside <code>tokens/</code> and <code>generated/</code>; every component token resolves; no use of deprecated tokens past removal date','Blocks merge'],
['Visual regression','Every Storybook story × 3 themes (default, high-saturation, low-contrast) × light/dark × LTR/RTL × comfortable/compact. Playwright or Chromatic. Threshold 0.1%','Blocks merge; baselines updated by design owner'],
['Accessibility (automated)','axe-core on every story and every page template (<code>a11y: test: "error"</code> in Storybook; <code>@axe-core/playwright</code> in e2e). Includes color-contrast, labels, ARIA validity','Blocks merge on serious/critical'],
['Accessibility (manual)','Keyboard-only pass, NVDA + Firefox and VoiceOver + Safari on 5 key flows each release; 200% zoom; forced-colors','Release checklist'],
['Localisation','Pseudo-locale +30%, an RTL run, a long school name (80 chars), Swahili date/number formats','Blocks merge for new components'],
['Performance','Theme CSS ≤ 4 KB gzip per tenant; no theme network request before first paint; CLS ≈ 0 from theme or font swap','CI budget'],
['Theme preview (tenant admin)','Live preview of light, dark, and key components with the adjustment messages before publish; publish confirms what changed; one-click rollback','Product requirement']])+'''
<h3>8.1 The three test themes</h3>'''+tbl(['Theme','Inputs','Purpose'],[
['A · Default','primary #2E7D32, accent #C79639, Inter','Baseline and the most common real tenant shape'],
['B · High saturation','primary #FF1493, accent #00E5FF, Nunito Sans, 40-character school name','Glare, dark-text-on-brand, long names'],
['C · Low contrast','primary #F2E27A, accent #CFE8E0, no logo','Pale brand colours: text shade, edge border, tint behaviour']])+'''
<p>Reference outputs for all three (CSS and JSON reports) are in <code>generated/</code> and are the visual-regression inputs.</p>''')
B.append('<h2 class="part">9. Handoff checklists</h2><h3>9.1 Accessibility checklist (applies to every component and page)</h3>'+'<ul class="checks">'+''.join(f'<li>{x}</li>' for x in [
'Text contrast ≥ 4.5:1 (≥ 3:1 for text 24 px / 18.66 px bold and above); UI boundaries and icons that carry meaning ≥ 3:1.',
'Checked in light and dark, in all three reference themes.',
'Colour is never the only signal: status has icon + text, selection has indicator + weight, links in body text are underlined.',
'Visible focus on every interactive element (2 px ring, 3:1 against both the element and its surround); focus not obscured by sticky headers.',
'Fully operable by keyboard; logical focus order; no traps except modals; Esc closes overlays; skip link to main content.',
'Real elements first (button, a, input, table); ARIA only to fill gaps; roles, names and states match the spec in section 5.',
'Every input has a programmatic label; errors identified in text, linked with aria-describedby, summarised on submit.',
'Touch targets ≥ 44 × 44 px (24 × 24 px minimum with spacing exception).',
'Works at 200% zoom and 320 px width without horizontal scroll (tables may scroll within their container); text spacing overrides do not clip.',
'Respects prefers-reduced-motion and prefers-color-scheme; no content flashes more than 3 times per second.',
'Images have meaningful alt text or alt="" if decorative; tenant logos use "{School name} home"; login image alt is mandatory.',
'Page has one h1, ordered headings, landmarks (header, nav, main, footer), and a unique title; lang is set.',
'Dynamic changes are announced (live regions) without stealing focus; loading states use aria-busy.',
'RTL checked: layout mirrors, icons flip where directional, numbers and codes stay LTR.',
'Windows High Contrast / forced-colors checked: borders and focus remain visible.',
'axe: zero serious or critical issues; manual screen-reader pass on key flows.'])+'</ul>'+'''
<h3>9.2 Email and PDF template theming rules</h3><p>Email and PDF cannot rely on CSS variables, web fonts, or dark-mode media queries consistently, so they use a <b>resolved, flattened</b> subset of the same theme.</p>'''+tbl(['Rule','Email','PDF (report cards, invoices, receipts)'],[
['Token source','Style Dictionary "email" target: flat JSON of resolved hex values from the tenant\'s compiled <b>light</b> palette; inlined as attributes and inline styles at send time','Same flat JSON, applied by the PDF renderer; print uses the light palette only'],
['Brand colours used','Header band: primary fill with <code>text-on-primary</code>; links: <code>action-primary-text</code>; buttons: bulletproof table-cell buttons using fill + on-colour; accent only for a thin rule','Header rule and table header in primary (or ink when primary is faint); totals and links in <code>action-primary-text</code>; accent for a single highlight'],
['Contrast','Same 4.5:1 and 3:1 checks as the app; the compiler already guarantees them','Same; additionally check greyscale print (see below)'],
['Dark mode','Provide <code>color-scheme: light dark</code> and a small dark override for body/background only; test in Apple Mail and Outlook. Do not recolour logos with CSS: send the optional dark logo with <code>picture</code>/class swap where supported, otherwise place the logo on a primary band that works in both','Not applicable: always light, print-safe'],
['Fonts','Web-safe stack: <code>Arial, Helvetica, sans-serif</code> (tenant font is not used in email). Minimum 14 px body, 12 px footer','Embed the approved font (subset) when it is the tenant font; fallback Inter. Minimum 9 pt body, 8 pt footnotes'],
['Logo','PNG, 2× (≈ 360 px wide shown at 180 px), alt text = school name, hosted on the platform CDN; max height 48 px; background transparent','Vector (sanitised SVG) when available else 300 dpi PNG; max height 18 mm; clear space 25%'],
['Layout','Single column, max 600 px, table-based, 16 px side padding, buttons ≥ 44 px tall','A4 and Letter safe margins 15–20 mm; repeating header/footer; page numbers "Page x of y"'],
['Required elements','School name and address in the footer, reason for the email, unsubscribe / preferences link where applicable, plain-text alternative, "Powered by EduMyles" unless white-label','School name, document title, date, reference number, page numbers; tagged PDF (PDF/UA) for accessibility; document language and title metadata'],
['Locked','Status colours, neutral text/background, spacing and type sizes','Same'],
['Dates, numbers, currency','Formatted for the recipient locale and tenant currency at render time','Same, plus tabular alignment for amounts'],
['Greyscale check','Not required','Convert to greyscale: all table headers and totals must remain distinguishable; never rely on colour to mark paid/overdue (use words)'],
['Testing','Litmus or Email on Acid across Gmail, Outlook (Windows, Mac), Apple Mail, Yahoo; render with the three reference themes','Render the three reference themes; PDF/UA validator (PAC) and a screen-reader read-through']])+'''
<h3>9.3 Release checklist for a design-system version</h3><ul class="checks"><li>Token JSON validated and Style Dictionary build clean on all five targets.</li><li>Theme compiler tests pass; three reference themes regenerate with no diff, or the diff is reviewed.</li><li>Visual regression approved; axe clean; manual screen-reader pass recorded.</li><li>Changelog, deprecations and migration notes written; tenant notice drafted if rendering changes.</li><li>Storybook deployed with the theme, mode, density, direction and text-expansion toolbar.</li></ul>''')
B.append('<h2 class="part">Appendix A. Semantic colour tokens</h2><p>Owner: <b>Locked</b> = platform, <b>Derived</b> = computed from the tenant\'s brand inputs (per-tenant values are in the compiled CSS), <b>Yes (input)</b> = the tenant\'s brand input itself.</p>'+tbl(['Token','Light','Dark','Tenant','Note'],sem_rows,'sm')+'<h3>Appendix B. File map</h3>'+code('''edumyles-design-system/
  EduMyles-Design-System-Theming-Architecture.pdf   this document
  tokens/primitives.tokens.json  semantic.tokens.json  component.tokens.json
  schema/tenant-theme.schema.json
  examples/default | high-saturation | low-contrast .theme.json
  tools/compile-theme.mjs  theme.test.mjs  style-dictionary.config.json  build_pdf.py
  generated/platform-default.css  <tenant>.css  <tenant>.report.json
  storybook/preview.tsx
'''))
html_doc=f'<!doctype html><html><head><meta charset="utf-8"><style>{CSSDOC}</style></head><body>'+''.join(B)+'</body></html>'
open('/tmp/ds.html','w').write(html_doc)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();pg.set_content(html_doc)
    pg.pdf(path='EduMyles-Design-System-Theming-Architecture.pdf',format='A4',print_background=True,margin=dict(top='15mm',bottom='16mm',left='13mm',right='13mm'),display_header_footer=True,header_template='<span></span>',footer_template='<div style="font:8px Arial;color:#777;width:100%;text-align:center">EduMyles design system and theming architecture v1.0 · <span class="pageNumber"></span> / <span class="totalPages"></span></div>')
    b.close()
print('built')
