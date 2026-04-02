import { test as base, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

export const AUTH_STORAGE_STATE_PATH = path.join("e2e", ".auth", "admin.json");

type AuthFixtures = {
  authStatePath: string;
};

export const test = base.extend<AuthFixtures>({
  authStatePath: async ({}, use) => {
    fs.mkdirSync(path.dirname(AUTH_STORAGE_STATE_PATH), { recursive: true });
    await use(AUTH_STORAGE_STATE_PATH);
  },
});

export { expect };

