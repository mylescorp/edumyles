#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { loadEnvFiles, parseArgs, printJsonAndExit } from "./lib/env.mjs";

const args = parseArgs();
const loadedEnvFiles = loadEnvFiles(args.envFiles);
const fullSmoke = args.flags.has("full-smoke");
const skipBuild = args.flags.has("skip-build");
const skipConvexDeploy = args.flags.has("skip-convex-deploy");

const steps = [];

function resolveCommand(command) {
  if (process.platform === "win32" && command === "npm") return "npm.cmd";
  return command;
}

function run(name, command, commandArgs, options = {}) {
  const startedAt = Date.now();
  const spawnOptions = {
    stdio: "inherit",
    env: process.env,
    ...options,
  };
  const result =
    process.platform === "win32" && command === "npm"
      ? spawnSync(["npm", ...commandArgs].join(" "), { ...spawnOptions, shell: true })
      : spawnSync(resolveCommand(command), commandArgs, spawnOptions);
  const durationMs = Date.now() - startedAt;
  const ok = result.status === 0;
  steps.push({
    name,
    ok,
    exitCode: result.status,
    durationMs,
    error: result.error?.message,
  });
  if (!ok) {
    throw new Error(`${name} failed with exit code ${result.status}: ${result.error?.message ?? ""}`.trim());
  }
}

function requireEnvForFullSmoke() {
  const failures = [];
  if (fullSmoke) {
    if (!process.env.E2E_SESSION_TOKEN && process.env.E2E_SEED_DATA !== "true") {
      failures.push(
        "Set E2E_SESSION_TOKEN or E2E_SEED_DATA=true before running --full-smoke onboarding E2E"
      );
    }
    if (!process.env.RESEND_SMOKE_TO) failures.push("Set RESEND_SMOKE_TO for --full-smoke");
    if (!process.env.SMS_SMOKE_TO) failures.push("Set SMS_SMOKE_TO for --full-smoke");
  }
  if (failures.length > 0) {
    throw new Error(failures.join("; "));
  }
}

try {
  requireEnvForFullSmoke();

  run("production readiness", "node", [
    "scripts/production-readiness-check.mjs",
    ...args.envFiles.flatMap((file) => ["--env-file", file]),
  ]);
  run("type-check", "npm", ["run", "type-check"]);
  run("tenant isolation tests", "npm", ["run", "test:tenant-isolation"]);

  if (!skipBuild) {
    run("shared build", "npm", ["run", "build", "--workspace=@edumyles/shared"]);
    run("frontend build", "npm", ["run", "build", "--workspace=frontend"]);
    run("landing build", "npm", ["run", "build", "--workspace=landing"]);
    run("mobile build", "npm", ["run", "build", "--workspace=mobile"]);
  }

  if (fullSmoke) {
    run("provider smoke checks", "node", [
      "scripts/production-smoke.mjs",
      ...args.envFiles.flatMap((file) => ["--env-file", file]),
    ]);
    run("tenant onboarding E2E", "npm", ["run", "test:e2e:onboarding"], {
      env: { ...process.env, REQUIRE_E2E_ONBOARDING: "true" },
    });
  }

  if (!skipConvexDeploy) {
    run("convex deploy", "npm", ["run", "deploy", "--", "--yes"], {
      cwd: "convex",
    });
  }

  printJsonAndExit({
    ok: true,
    fullSmoke,
    loadedEnvFiles,
    steps,
    checkedAt: new Date().toISOString(),
  });
} catch (error) {
  printJsonAndExit({
    ok: false,
    fullSmoke,
    loadedEnvFiles,
    steps,
    error: error instanceof Error ? error.message : String(error),
    checkedAt: new Date().toISOString(),
  });
}
