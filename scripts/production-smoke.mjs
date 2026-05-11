#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { loadEnvFiles, parseArgs, printJsonAndExit } from "./lib/env.mjs";

const args = parseArgs();
const loadedEnvFiles = loadEnvFiles(args.envFiles);
const envArgs = args.envFiles.flatMap((file) => ["--env-file", file]);
const checks = [
  ["Resend", "scripts/resend-smoke-check.mjs"],
  ["SMS", "scripts/sms-smoke-check.mjs"],
  ["Payments", "scripts/payments-smoke-check.mjs"],
  ["Cal.com", "scripts/calcom-smoke-check.mjs"],
];
const results = [];

for (const [name, script] of checks) {
  const startedAt = Date.now();
  const result = spawnSync("node", [script, ...envArgs], {
    stdio: "inherit",
    env: process.env,
  });
  const ok = result.status === 0;
  results.push({ name, ok, exitCode: result.status, durationMs: Date.now() - startedAt });
  if (!ok) break;
}

printJsonAndExit({
  ok: results.every((result) => result.ok),
  loadedEnvFiles,
  results,
  checkedAt: new Date().toISOString(),
});
