import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useConvex } from "convex/react";

import { api } from "../lib/convexApi";

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
  signIn: (email: string, sessionToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = "edumyles.mobile.session";
let memorySession: SessionRecord | null = null;

const AuthContext = createContext<AuthContextValue | null>(null);

const getStorage = () => {
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

const loadStoredSession = async (): Promise<SessionRecord | null> => {
  const storage = getStorage();

  if (storage) {
    const raw = await storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionRecord;
    } catch {
      await storage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  return memorySession;
};

const saveStoredSession = async (session: SessionRecord | null) => {
  const storage = getStorage();

  if (storage) {
    if (!session) {
      await storage.removeItem(STORAGE_KEY);
      return;
    }

    await storage.setItem(STORAGE_KEY, JSON.stringify(session));
    return;
  }

  memorySession = session;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const convex = useConvex();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

        const session = await convex.query(api.sessions.getSession, {
          sessionToken: stored.sessionToken,
        });

        if (!session) {
          await saveStoredSession(null);
          if (!cancelled) {
            setSessionToken(null);
            setUser(null);
          }
          return;
        }

        if (!cancelled) {
          setSessionToken(session.sessionToken ?? null);
          setUser({
            email: session.email ?? stored.email,
            role: session.role ?? "student",
            tenantId: session.tenantId ?? "",
            userId: session.userId ?? "",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [convex]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(user && sessionToken),
      isLoading,
      sessionToken,
      user,
      signIn: async (email: string, providedSessionToken?: string) => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedToken = providedSessionToken?.trim();

        if (!trimmedEmail) {
          throw new Error("Enter the email address tied to your EduMyles account.");
        }

        if (!trimmedToken) {
          throw new Error("Enter your active EduMyles session token to continue on mobile.");
        }

        setIsLoading(true);
        try {
          const session = await convex.query(api.sessions.getSession, {
            sessionToken: trimmedToken,
          });

          if (!session) {
            throw new Error("That session token is invalid or has expired.");
          }

          if (!session.email || session.email.toLowerCase() !== trimmedEmail) {
            throw new Error("The session token does not belong to that email address.");
          }

          if (!session.sessionToken) {
            throw new Error("The session token is missing required session data.");
          }

          await saveStoredSession({
            email: trimmedEmail,
            sessionToken: session.sessionToken,
          });

          setSessionToken(session.sessionToken);
          setUser({
            email: session.email,
            role: session.role ?? "student",
            tenantId: session.tenantId ?? "",
            userId: session.userId ?? "",
          });
        } finally {
          setIsLoading(false);
        }
      },
      signOut: async () => {
        await saveStoredSession(null);
        setSessionToken(null);
        setUser(null);
      },
    }),
    [convex, isLoading, sessionToken, user]
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
