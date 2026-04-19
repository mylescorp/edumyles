import { ConvexHttpClient } from "convex/browser";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

let cachedConvexUrl: string | null = null;

function readEnvValueFromFile(filePath: string, key: string): string | null {
  if (!existsSync(filePath)) return null;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;
    const currentKey = line.slice(0, separatorIndex).trim();
    if (currentKey !== key) continue;
    const value = line.slice(separatorIndex + 1).trim();
    return value.replace(/^['"]|['"]$/g, "");
  }

  return null;
}

export function resolveLandingConvexUrl() {
  if (cachedConvexUrl) return cachedConvexUrl;

  const directEnv =
    process.env.CONVEX_URL?.trim() ||
    process.env.NEXT_PUBLIC_CONVEX_URL?.trim();

  if (directEnv) {
    cachedConvexUrl = directEnv;
    return cachedConvexUrl;
  }

  const candidateFiles = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "..", ".env.local"),
    path.resolve(process.cwd(), "..", "frontend", ".env.local"),
    path.resolve(process.cwd(), "..", "convex", ".env.local"),
  ];

  for (const filePath of candidateFiles) {
    const fromFile =
      readEnvValueFromFile(filePath, "CONVEX_URL") ||
      readEnvValueFromFile(filePath, "NEXT_PUBLIC_CONVEX_URL");
    if (fromFile) {
      cachedConvexUrl = fromFile;
      return cachedConvexUrl;
    }
  }

  throw new Error(
    "Convex URL is not configured for the landing app. Set CONVEX_URL or NEXT_PUBLIC_CONVEX_URL."
  );
}

export function getLandingConvexClient() {
  return new ConvexHttpClient(resolveLandingConvexUrl());
}
