import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    envFiles: [],
    flags: new Set(),
    values: new Map(),
    rest: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--env-file") {
      const value = argv[index + 1];
      if (!value) throw new Error("--env-file requires a path");
      args.envFiles.push(value);
      index += 1;
      continue;
    }
    if (arg.startsWith("--env-file=")) {
      args.envFiles.push(arg.slice("--env-file=".length));
      continue;
    }
    if (arg.startsWith("--") && arg.includes("=")) {
      const [key, ...parts] = arg.slice(2).split("=");
      args.values.set(key, parts.join("="));
      continue;
    }
    if (arg.startsWith("--")) {
      args.flags.add(arg.slice(2));
      continue;
    }
    args.rest.push(arg);
  }

  return args;
}

export function loadEnvFiles(envFiles = []) {
  const loaded = [];
  for (const file of envFiles) {
    const absolutePath = path.isAbsolute(file) ? file : path.resolve(repoRoot, file);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Env file not found: ${file}`);
    }

    const content = fs.readFileSync(absolutePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
    loaded.push(absolutePath);
  }
  return loaded;
}

export function isPlaceholder(value) {
  return /x{6,}|placeholder|your-deployment|example\.com|localhost|generate-a-long/i.test(
    String(value ?? "")
  );
}

export function missingEnv(keys, { allowPlaceholder = false } = {}) {
  return keys.flatMap((key) => {
    const value = process.env[key]?.trim();
    if (!value) return [`Missing required env: ${key}`];
    if (!allowPlaceholder && isPlaceholder(value)) {
      return [`Required env appears to be a placeholder: ${key}`];
    }
    return [];
  });
}

export function envReport(keys, { allowPlaceholder = false } = {}) {
  return keys.map((key) => {
    const value = process.env[key]?.trim();
    return {
      key,
      present: Boolean(value),
      placeholder: Boolean(value) && !allowPlaceholder && isPlaceholder(value),
    };
  });
}

export function printJsonAndExit(report) {
  console.log(JSON.stringify(report, null, 2));
  if (report.ok === false) {
    process.exitCode = 1;
  }
}
