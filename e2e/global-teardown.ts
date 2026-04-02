import * as fs from "node:fs";
import * as path from "node:path";
import { AUTH_STORAGE_STATE_PATH } from "./fixtures/auth.fixture";

export default async function globalTeardown() {
  if (process.env.E2E_PRESERVE_AUTH !== "true" && fs.existsSync(AUTH_STORAGE_STATE_PATH)) {
    fs.rmSync(AUTH_STORAGE_STATE_PATH, { force: true });
  }

  const runtimeDir = path.join(".e2e-runtime");
  if (fs.existsSync(runtimeDir)) {
    fs.rmSync(runtimeDir, { recursive: true, force: true });
  }
}

