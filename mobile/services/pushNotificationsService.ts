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

export async function registerPushToken(userId: string) {
  if (Platform.OS === "web" || !Device.isDevice) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "General",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F9820B"
    });
  }

  const permissions = await Notifications.getPermissionsAsync();
  const finalPermission = permissions.granted ? permissions : await Notifications.requestPermissionsAsync();

  if (!finalPermission.granted) return;

  const projectId = getProjectId();
  if (!projectId) return;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });

  await supabase.from("user_push_tokens").upsert(
    {
      user_id: userId,
      expo_push_token: token.data,
      platform: Platform.OS,
      is_active: true,
      updated_at: new Date().toISOString()
    },
    { onConflict: "expo_push_token" }
  );
}
