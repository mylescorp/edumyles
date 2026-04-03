const DEFAULT_TIMEOUT_MS = 15000;

function getAppBaseUrl() {
  const appUrl = process.env.EXPO_PUBLIC_APP_URL?.trim();
  if (!appUrl) {
    throw new Error("EXPO_PUBLIC_APP_URL is not configured for mobile sign-in.");
  }
  return appUrl.replace(/\/+$/, "");
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${getAppBaseUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchMobileAuthStatus(path: string): Promise<MobileAuthStatusResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${getAppBaseUrl()}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => ({}))) as MobileAuthStatusResponse & {
      error?: string;
    };

    if (response.ok || response.status === 409 || response.status === 410) {
      return data;
    }

    throw new Error(data.error || `Request failed with status ${response.status}`);
  } finally {
    clearTimeout(timeout);
  }
}

export type MobileAuthRequest = {
  requestId: string;
  approvalUrl: string;
  expiresAt: number;
  pollIntervalMs: number;
};

export type MobileSessionResponse = {
  session: {
    sessionToken: string;
    email: string;
    role: string;
    tenantId: string;
    userId: string;
  };
};

export type MobileAuthStatusResponse =
  | { status: "pending"; expiresAt: number }
  | { status: "completed"; session: MobileSessionResponse["session"] }
  | { status: "expired" | "cancelled" | "consumed" };

export async function startMobileAuth(email: string, deviceInfo?: string) {
  return fetchJson<MobileAuthRequest>("/api/auth/mobile/start", {
    method: "POST",
    body: JSON.stringify({ email, deviceInfo }),
  });
}

export async function getMobileAuthStatus(requestId: string) {
  return fetchMobileAuthStatus(
    `/api/auth/mobile/status?requestId=${encodeURIComponent(requestId)}`
  );
}

export async function getMobileSession(sessionToken: string) {
  return fetchJson<MobileSessionResponse>(
    `/api/auth/mobile/session?sessionToken=${encodeURIComponent(sessionToken)}`
  );
}

export async function revokeMobileSession(sessionToken: string) {
  return fetchJson<{ success: boolean }>("/api/auth/mobile/logout", {
    method: "POST",
    body: JSON.stringify({ sessionToken }),
  });
}
