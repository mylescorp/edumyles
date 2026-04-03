import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";

import {
  getMobileAuthStatus,
  getMobileSession,
  MobileAuthRequest,
  MobileAuthStatusResponse,
  revokeMobileSession,
  startMobileAuth,
} from "../lib/appApi";

type SessionRecord = {
  email: string;
  sessionToken: string;
};

type AuthUser = {
  email: string;
  role: string;
  tenantId: string;
  userId: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionToken: string | null;
  user: AuthUser | null;
  pendingAuthRequest: MobileAuthRequest | null;
  signIn: (email: string) => Promise<MobileAuthRequest>;
  checkSignInStatus: (requestId?: string) => Promise<MobileAuthStatusResponse>;
  clearPendingSignIn: () => void;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = "edumyles.mobile.session";
let memorySession: SessionRecord | null = null;

const AuthContext = createContext<AuthContextValue | null>(null);

const getFallbackStorage = () => {
  try {
    return require("@react-native-async-storage/async-storage").default as {
      getItem: (key: string) => Promise<string | null>;
      setItem: (key: string, value: string) => Promise<void>;
      removeItem: (key: string) => Promise<void>;
    };
  } catch {
    return null;
  }
};

const readSecureValue = async (key: string) => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
};

const writeSecureValue = async (key: string, value: string) => {
  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch {
    return false;
  }
};

const deleteSecureValue = async (key: string) => {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch {
    return false;
  }
};

const loadStoredSession = async (): Promise<SessionRecord | null> => {
  const secureValue = await readSecureValue(STORAGE_KEY);
  if (secureValue) {
    try {
      return JSON.parse(secureValue) as SessionRecord;
    } catch {
      await deleteSecureValue(STORAGE_KEY);
    }
  }

  const storage = getFallbackStorage();
  if (storage) {
    const raw = await storage.getItem(STORAGE_KEY);
    if (!raw) {
      return memorySession;
    }
    try {
      return JSON.parse(raw) as SessionRecord;
    } catch {
      await storage.removeItem(STORAGE_KEY);
      return memorySession;
    }
  }

  return memorySession;
};

const saveStoredSession = async (session: SessionRecord | null) => {
  if (!session) {
    await deleteSecureValue(STORAGE_KEY);
    const fallbackStorage = getFallbackStorage();
    if (fallbackStorage) {
      await fallbackStorage.removeItem(STORAGE_KEY);
    }
    memorySession = null;
    return;
  }

  const payload = JSON.stringify(session);
  const savedSecurely = await writeSecureValue(STORAGE_KEY, payload);
  if (!savedSecurely) {
    const fallbackStorage = getFallbackStorage();
    if (fallbackStorage) {
      await fallbackStorage.setItem(STORAGE_KEY, payload);
    } else {
      memorySession = session;
    }
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [pendingAuthRequest, setPendingAuthRequest] = useState<MobileAuthRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback(
    async (session: { email: string; role: string; sessionToken: string; tenantId: string; userId: string }) => {
      const normalizedEmail = session.email.trim().toLowerCase();
      await saveStoredSession({
        email: normalizedEmail,
        sessionToken: session.sessionToken,
      });

      setSessionToken(session.sessionToken);
      setUser({
        email: normalizedEmail,
        role: session.role || "student",
        tenantId: session.tenantId || "",
        userId: session.userId || "",
      });
      setPendingAuthRequest(null);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    const hydrateSession = async () => {
      try {
        const stored = await loadStoredSession();
        if (!stored?.sessionToken) {
          if (!cancelled) {
            setIsLoading(false);
          }
          return;
        }

        const session = await getMobileSession(stored.sessionToken);
        if (!session?.session?.sessionToken) {
          throw new Error("Stored session is no longer valid.");
        }

        if (!cancelled) {
          await applySession(session.session);
        }
      } catch {
        await saveStoredSession(null);
        if (!cancelled) {
          setSessionToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(user && sessionToken),
      isLoading,
      sessionToken,
      user,
      pendingAuthRequest,
      signIn: async (email: string) => {
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail) {
          throw new Error("Enter the email address tied to your EduMyles account.");
        }

        setIsLoading(true);
        try {
          const request = await startMobileAuth(trimmedEmail, "EduMyles Mobile");
          setPendingAuthRequest(request);
          return request;
        } finally {
          setIsLoading(false);
        }
      },
      checkSignInStatus: async (requestId?: string) => {
        const activeRequestId = requestId ?? pendingAuthRequest?.requestId;
        if (!activeRequestId) {
          throw new Error("Start a mobile sign-in request first.");
        }

        const status = await getMobileAuthStatus(activeRequestId);
        if (status.status === "completed") {
          await applySession(status.session);
        } else if (status.status !== "pending") {
          setPendingAuthRequest(null);
        }
        return status;
      },
      clearPendingSignIn: () => {
        setPendingAuthRequest(null);
      },
      signOut: async () => {
        const activeSessionToken = sessionToken;
        await saveStoredSession(null);
        setSessionToken(null);
        setUser(null);
        setPendingAuthRequest(null);

        if (activeSessionToken) {
          try {
            await revokeMobileSession(activeSessionToken);
          } catch {
            // Local logout still succeeds even if the network request fails.
          }
        }
      },
    }),
    [applySession, isLoading, pendingAuthRequest, sessionToken, user]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
};
