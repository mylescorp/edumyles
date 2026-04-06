/**
 * Cache service tests.
 * async-storage is mocked to null in setup.ts so all operations run through
 * the in-memory fallback — this lets us test the full read/write/delete
 * contract without any native module dependencies.
 */

import {
  getCachedQuery,
  setCachedQuery,
  removeCachedQuery,
  getOfflineMutationQueue,
  enqueueOfflineMutation,
  replaceOfflineMutationQueue,
  clearOfflineMutationQueue,
  getOfflineMutationCount,
  getLastSyncAt,
  setLastSyncAt,
  type OfflineMutationQueueItem,
} from "../services/cache";

// Reset the module between tests so the memoryStore is fresh
beforeEach(() => {
  jest.resetModules();
});

beforeEach(async () => {
  await clearOfflineMutationQueue();
  await removeCachedQuery("grades:student-1");
  await removeCachedQuery("attendance:2026-04");
  await removeCachedQuery("wallet:balance");
});

// Re-import after reset so each test gets a clean module
async function getCache() {
  return import("../services/cache");
}

describe("getCachedQuery / setCachedQuery / removeCachedQuery", () => {
  it("returns null for unknown keys", async () => {
    expect(await getCachedQuery("no-such-key")).toBeNull();
  });

  it("round-trips a value", async () => {
    await setCachedQuery("grades:student-1", { subjects: ["Math", "English"] });
    const result = await getCachedQuery<{ subjects: string[] }>("grades:student-1");
    expect(result?.subjects).toEqual(["Math", "English"]);
  });

  it("returns null after removal", async () => {
    await setCachedQuery("attendance:2026-04", [{ date: "2026-04-01", status: "present" }]);
    await removeCachedQuery("attendance:2026-04");
    expect(await getCachedQuery("attendance:2026-04")).toBeNull();
  });

  it("overwrites an existing value", async () => {
    await setCachedQuery("wallet:balance", { amount: 100 });
    await setCachedQuery("wallet:balance", { amount: 250 });
    const result = await getCachedQuery<{ amount: number }>("wallet:balance");
    expect(result?.amount).toBe(250);
  });
});

describe("offline mutation queue", () => {
  const makeItem = (id: string): OfflineMutationQueueItem => ({
    id,
    key: "grades.submit",
    payload: { score: 80 },
    createdAt: Date.now(),
  });

  it("starts empty", async () => {
    expect(await getOfflineMutationQueue()).toEqual([]);
  });

  it("enqueues items in order", async () => {
    await enqueueOfflineMutation(makeItem("a"));
    await enqueueOfflineMutation(makeItem("b"));
    const queue = await getOfflineMutationQueue();
    expect(queue.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("returns correct count", async () => {
    await enqueueOfflineMutation(makeItem("x"));
    await enqueueOfflineMutation(makeItem("y"));
    expect(await getOfflineMutationCount()).toBe(2);
  });

  it("replaces queue", async () => {
    await enqueueOfflineMutation(makeItem("old"));
    await replaceOfflineMutationQueue([makeItem("new1"), makeItem("new2")]);
    const queue = await getOfflineMutationQueue();
    expect(queue.map((i) => i.id)).toEqual(["new1", "new2"]);
  });

  it("clears queue", async () => {
    await enqueueOfflineMutation(makeItem("clear-me"));
    await clearOfflineMutationQueue();
    expect(await getOfflineMutationQueue()).toEqual([]);
    expect(await getOfflineMutationCount()).toBe(0);
  });
});

describe("last sync timestamp", () => {
  it("returns null when never set", async () => {
    expect(await getLastSyncAt()).toBeNull();
  });

  it("round-trips a timestamp", async () => {
    const ts = 1_700_000_000_000;
    await setLastSyncAt(ts);
    expect(await getLastSyncAt()).toBe(ts);
  });
});
