import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { supabase } from "@/services/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

const getProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ??
  Constants.easConfig?.projectId;

const installedAppOwnershipValues = ["standalone", "bare"];

const getRuntimeInfo = () => {
  const appOwnership = String(Constants.executionEnvironment ?? Constants.appOwnership ?? "unknown");

  return {
    appOwnership,
    isInstalledApp: installedAppOwnershipValues.includes(appOwnership)
  };
};

export type PushTokenRegistrationResult = {
  status: "registered" | "skipped" | "permission_denied" | "missing_project_id" | "error";
  message: string;
  appOwnership?: string;
  isInstalledApp?: boolean;
  platform?: string;
  token?: string;
};

export async function registerPushToken(userId: string) {
  try {
    if (Platform.OS === "web" || !Device.isDevice) {
      return {
        status: "skipped",
        message: "Las notificaciones push solo se registran en dispositivos físicos.",
        platform: Platform.OS
      } satisfies PushTokenRegistrationResult;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("vendimia-general", {
        name: "Iglesia Vendimia Internacional",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#F9820B"
      });
    }

    const permissions = await Notifications.getPermissionsAsync();
    const finalPermission = permissions.granted ? permissions : await Notifications.requestPermissionsAsync();

    if (!finalPermission.granted) {
      return {
        status: "permission_denied",
        message: "El permiso de notificaciones no fue concedido.",
        appOwnership: getRuntimeInfo().appOwnership,
        isInstalledApp: getRuntimeInfo().isInstalledApp,
        platform: Platform.OS
      } satisfies PushTokenRegistrationResult;
    }

    const projectId = getProjectId();
    if (!projectId) {
      return {
        status: "missing_project_id",
        message: "No se encontró el projectId de EAS para registrar el token.",
        appOwnership: getRuntimeInfo().appOwnership,
        isInstalledApp: getRuntimeInfo().isInstalledApp,
        platform: Platform.OS
      } satisfies PushTokenRegistrationResult;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    const runtimeInfo = getRuntimeInfo();

    const { error } = await supabase.from("user_push_tokens").upsert(
      {
        user_id: userId,
        expo_push_token: token.data,
        platform: Platform.OS,
        app_ownership: runtimeInfo.appOwnership,
        device_name: Device.deviceName,
        project_id: projectId,
        is_active: true,
        updated_at: new Date().toISOString()
      },
      { onConflict: "expo_push_token" }
    );

    if (error) throw error;

    return {
      status: "registered",
      message: runtimeInfo.isInstalledApp
        ? `Token instalado registrado como ${Platform.OS}/${runtimeInfo.appOwnership}.`
        : `Token registrado como ${Platform.OS}/${runtimeInfo.appOwnership}. Abre la APK/IPA instalada para generar un token standalone o bare.`,
      appOwnership: runtimeInfo.appOwnership,
      isInstalledApp: runtimeInfo.isInstalledApp,
      platform: Platform.OS,
      token: token.data
    } satisfies PushTokenRegistrationResult;
  } catch (error) {
    const runtimeInfo = getRuntimeInfo();

    return {
      status: "error",
      message: error instanceof Error ? error.message : "No fue posible registrar el token push.",
      appOwnership: runtimeInfo.appOwnership,
      isInstalledApp: runtimeInfo.isInstalledApp,
      platform: Platform.OS
    } satisfies PushTokenRegistrationResult;
  }
}
