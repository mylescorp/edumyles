// Copies logos/favicons into an app's public folder. Usage: node scripts/sync-assets.mjs ../../apps/web/public/brand
import fs from 'node:fs'; import path from 'node:path';
const dest = process.argv[2]; if (!dest) { console.error('usage: sync-assets.mjs <dest-dir>'); process.exit(1); }
const src = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../assets/logos');
fs.mkdirSync(dest, { recursive: true });
for (const f of fs.readdirSync(src).filter(f => !f.endsWith('.md'))) fs.copyFileSync(path.join(src, f), path.join(dest, f));
console.log('copied to', dest);
