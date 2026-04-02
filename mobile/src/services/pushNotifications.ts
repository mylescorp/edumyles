import { Platform } from "react-native";

import { api } from "../lib/convexApi";

declare const require: (id: string) => any;

type NotificationsModule = {
  setNotificationHandler?: (handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
      shouldShowBanner?: boolean;
      shouldShowList?: boolean;
    }>;
  }) => void;
  getPermissionsAsync: () => Promise<{ status?: string; granted?: boolean }>;
  requestPermissionsAsync: () => Promise<{ status?: string; granted?: boolean }>;
  getExpoPushTokenAsync: (options?: { projectId?: string }) => Promise<{ data: string }>;
};

type DeviceModule = {
  isDevice?: boolean;
  modelName?: string;
};

type ConstantsModule = {
  expoConfig?: { extra?: Record<string, unknown> };
  easConfig?: { projectId?: string };
};

export type PushRegistrationResult = {
  pushToken: string;
  provider: "expo";
  platform: string;
  deviceName?: string;
  notificationsEnabled: boolean;
};

function getNotificationsModule(): NotificationsModule | null {
  try {
    return require("expo-notifications") as NotificationsModule;
  } catch {
    return null;
  }
}

function getDeviceModule(): DeviceModule | null {
  try {
    return require("expo-device") as DeviceModule;
  } catch {
    return null;
  }
}

function getConstantsModule(): ConstantsModule | null {
  try {
    return require("expo-constants").default as ConstantsModule;
  } catch {
    return null;
  }
}

export function initializePushNotifications() {
  const notifications = getNotificationsModule();

  notifications?.setNotificationHandler?.({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult | null> {
  const notifications = getNotificationsModule();
  if (!notifications) return null;

  const device = getDeviceModule();
  if (device?.isDevice === false) {
    return null;
  }

  const existingPermissions = await notifications.getPermissionsAsync();
  const currentStatus = existingPermissions.status ?? (existingPermissions.granted ? "granted" : "denied");
  const finalPermissions =
    currentStatus === "granted"
      ? existingPermissions
      : await notifications.requestPermissionsAsync();

  const finalStatus =
    finalPermissions.status ?? (finalPermissions.granted ? "granted" : "denied");

  if (finalStatus !== "granted") {
    return null;
  }

  const constants = getConstantsModule();
  const projectId =
    (constants?.easConfig?.projectId as string | undefined) ??
    (constants?.expoConfig?.extra?.eas &&
    typeof (constants.expoConfig.extra.eas as { projectId?: string }).projectId === "string"
      ? (constants.expoConfig.extra.eas as { projectId?: string }).projectId
      : undefined) ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  const tokenResponse = await notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  return {
    pushToken: tokenResponse.data,
    provider: "expo",
    platform: Platform.OS,
    deviceName: device?.modelName,
    notificationsEnabled: true,
  };
}

export async function syncPushTokenWithBackend(args: {
  registerDeviceToken: (args: Record<string, unknown>) => Promise<unknown>;
  sessionToken: string;
  registration: PushRegistrationResult;
}) {
  const { registerDeviceToken, registration, sessionToken } = args;

  await registerDeviceToken({
    sessionToken,
    pushToken: registration.pushToken,
    provider: registration.provider,
    platform: registration.platform,
    deviceName: registration.deviceName,
    notificationsEnabled: registration.notificationsEnabled,
  });
}

export const registerMobileDeviceTokenMutation =
  api.modules.portal.student.mutations.registerMobileDeviceToken;
