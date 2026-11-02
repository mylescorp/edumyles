// Recompiles every examples/*.theme.json into generated/<tenant>.css + .report.json. Run: npm run build:themes
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
for (const f of fs.readdirSync(path.join(root, 'examples')).filter(f => f.endsWith('.theme.json'))) {
  const r = spawnSync('node', [path.join(root, 'tools/compile-theme.mjs'), path.join(root, 'examples', f)], { stdio: 'inherit' });
  if (r.status) process.exit(r.status);
}
