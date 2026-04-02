declare const require: (id: string) => any;

export type OfflineMutationQueueItem = {
  id: string;
  key: string;
  payload: Record<string, unknown>;
  createdAt: number;
};

const QUERY_PREFIX = "edumyles.mobile.cache.query";
const QUEUE_KEY = "edumyles.mobile.cache.queue";
const LAST_SYNC_KEY = "edumyles.mobile.cache.lastSyncAt";

const memoryStore = new Map<string, string>();

type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

function getStorage(): StorageLike | null {
  try {
    return require("@react-native-async-storage/async-storage").default as StorageLike;
  } catch {
    return null;
  }
}

async function getRaw(key: string): Promise<string | null> {
  const storage = getStorage();
  if (storage) {
    return storage.getItem(key);
  }
  return memoryStore.get(key) ?? null;
}

async function setRaw(key: string, value: string): Promise<void> {
  const storage = getStorage();
  if (storage) {
    await storage.setItem(key, value);
    return;
  }
  memoryStore.set(key, value);
}

async function removeRaw(key: string): Promise<void> {
  const storage = getStorage();
  if (storage) {
    await storage.removeItem(key);
    return;
  }
  memoryStore.delete(key);
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await getRaw(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    await removeRaw(key);
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await setRaw(key, JSON.stringify(value));
}

export async function getCachedQuery<T>(cacheKey: string): Promise<T | null> {
  return readJson<T | null>(`${QUERY_PREFIX}:${cacheKey}`, null);
}

export async function setCachedQuery<T>(cacheKey: string, value: T): Promise<void> {
  await writeJson(`${QUERY_PREFIX}:${cacheKey}`, value);
}

export async function removeCachedQuery(cacheKey: string): Promise<void> {
  await removeRaw(`${QUERY_PREFIX}:${cacheKey}`);
}

export async function getOfflineMutationQueue(): Promise<OfflineMutationQueueItem[]> {
  return readJson<OfflineMutationQueueItem[]>(QUEUE_KEY, []);
}

export async function enqueueOfflineMutation(item: OfflineMutationQueueItem): Promise<void> {
  const queue = await getOfflineMutationQueue();
  queue.push(item);
  await writeJson(QUEUE_KEY, queue);
}

export async function replaceOfflineMutationQueue(
  items: OfflineMutationQueueItem[],
): Promise<void> {
  await writeJson(QUEUE_KEY, items);
}

export async function clearOfflineMutationQueue(): Promise<void> {
  await removeRaw(QUEUE_KEY);
}

export async function getOfflineMutationCount(): Promise<number> {
  const queue = await getOfflineMutationQueue();
  return queue.length;
}

export async function setLastSyncAt(timestamp: number): Promise<void> {
  await setRaw(LAST_SYNC_KEY, String(timestamp));
}

export async function getLastSyncAt(): Promise<number | null> {
  const raw = await getRaw(LAST_SYNC_KEY);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
