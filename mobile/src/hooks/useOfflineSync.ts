import { useCallback, useEffect, useMemo, useState } from "react";

import {
  enqueueOfflineMutation,
  getCachedQuery,
  getLastSyncAt,
  getOfflineMutationCount,
  getOfflineMutationQueue,
  replaceOfflineMutationQueue,
  setCachedQuery,
  setLastSyncAt,
  type OfflineMutationQueueItem,
} from "../services/cache";

declare const require: (id: string) => any;

type MutationHandler = (payload: Record<string, unknown>) => Promise<void>;

type UseOfflineSyncOptions = {
  mutationHandlers?: Record<string, MutationHandler>;
};

type NetInfoState = {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
};

type NetInfoModule = {
  addEventListener: (listener: (state: NetInfoState) => void) => () => void;
  fetch: () => Promise<NetInfoState>;
};

function getNetInfoModule(): NetInfoModule | null {
  try {
    return require("@react-native-community/netinfo").default as NetInfoModule;
  } catch {
    try {
      return require("@react-native-netinfo/netinfo").default as NetInfoModule;
    } catch {
      return null;
    }
  }
}

function deriveOnlineState(state: NetInfoState | null | undefined): boolean {
  if (!state) return true;
  if (state.isInternetReachable === false) return false;
  if (state.isConnected === false) return false;
  return true;
}

export function useOfflineSync(options: UseOfflineSyncOptions = {}) {
  const { mutationHandlers = {} } = options;
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingMutations, setPendingMutations] = useState(0);
  const [lastSyncedAt, setLastSyncedAtState] = useState<number | null>(null);

  const refreshQueueState = useCallback(async () => {
    setPendingMutations(await getOfflineMutationCount());
    setLastSyncedAtState(await getLastSyncAt());
  }, []);

  const flushQueuedMutations = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    const queue = await getOfflineMutationQueue();
    if (queue.length === 0) {
      await refreshQueueState();
      return;
    }

    setIsSyncing(true);
    const remaining: OfflineMutationQueueItem[] = [];

    for (const item of queue) {
      const handler = mutationHandlers[item.key];
      if (!handler) {
        remaining.push(item);
        continue;
      }

      try {
        await handler(item.payload);
      } catch {
        remaining.push(item);
      }
    }

    await replaceOfflineMutationQueue(remaining);
    await setLastSyncAt(Date.now());
    await refreshQueueState();
    setIsSyncing(false);
  }, [isOnline, isSyncing, mutationHandlers, refreshQueueState]);

  useEffect(() => {
    const netInfo = getNetInfoModule();

    refreshQueueState();

    if (!netInfo) {
      return;
    }

    let mounted = true;

    netInfo.fetch().then((state) => {
      if (mounted) {
        setIsOnline(deriveOnlineState(state));
      }
    });

    const unsubscribe = netInfo.addEventListener((state) => {
      setIsOnline(deriveOnlineState(state));
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [refreshQueueState]);

  useEffect(() => {
    if (isOnline) {
      void flushQueuedMutations();
    }
  }, [flushQueuedMutations, isOnline]);

  const queueMutation = useCallback(
    async (key: string, payload: Record<string, unknown>) => {
      await enqueueOfflineMutation({
        id: `${key}:${Date.now()}`,
        key,
        payload,
        createdAt: Date.now(),
      });
      await refreshQueueState();
    },
    [refreshQueueState],
  );

  const cacheSnapshot = useCallback(async <T,>(key: string, value: T) => {
    await setCachedQuery(key, value);
  }, []);

  const readCachedSnapshot = useCallback(async <T,>(key: string) => {
    return getCachedQuery<T>(key);
  }, []);

  return useMemo(
    () => ({
      isOnline,
      isOffline: !isOnline,
      isSyncing,
      pendingMutations,
      lastSyncedAt,
      queueMutation,
      flushQueuedMutations,
      cacheSnapshot,
      readCachedSnapshot,
    }),
    [
      cacheSnapshot,
      flushQueuedMutations,
      isOnline,
      isSyncing,
      lastSyncedAt,
      pendingMutations,
      queueMutation,
      readCachedSnapshot,
    ],
  );
}

export function useCachedQueryValue<T>(cacheKey: string, liveValue: T | undefined) {
  const [cachedValue, setCachedValue] = useState<T | null>(null);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const cached = await getCachedQuery<T>(cacheKey);
      if (!cancelled) {
        setCachedValue(cached);
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [cacheKey]);

  useEffect(() => {
    if (liveValue === undefined) return;
    void setCachedQuery(cacheKey, liveValue);
    setCachedValue(liveValue);
  }, [cacheKey, liveValue]);

  return liveValue ?? cachedValue;
}
