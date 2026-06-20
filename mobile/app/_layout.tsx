import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  Montserrat_900Black,
  useFonts
} from "@expo-google-fonts/montserrat";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/hooks/use-auth";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const defaultTextProps = Text as typeof Text & {
  defaultProps?: { style?: unknown };
};

const defaultInputProps = TextInput as typeof TextInput & {
  defaultProps?: { style?: unknown; placeholderTextColor?: string };
};

defaultTextProps.defaultProps = {
  ...defaultTextProps.defaultProps,
  style: [{ fontFamily: fonts.regular }, defaultTextProps.defaultProps?.style]
};

defaultInputProps.defaultProps = {
  ...defaultInputProps.defaultProps,
  placeholderTextColor: colors.textSecondary,
  style: [{ fontFamily: fonts.regular }, defaultInputProps.defaultProps?.style]
};

function NotificationNavigation() {
  const handledResponseId = useRef<string | null>(null);

  useEffect(() => {
    const openResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response || handledResponseId.current === response.notification.request.identifier) return;

      const route = response.notification.request.content.data?.route;
      if (typeof route !== "string" || !route.startsWith("/")) return;

      handledResponseId.current = response.notification.request.identifier;
      router.push(route as never);
    };

    Notifications.getLastNotificationResponseAsync().then(openResponse).catch(() => undefined);
    const subscription = Notifications.addNotificationResponseReceivedListener(openResponse);

    return () => subscription.remove();
  }, []);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" backgroundColor={colors.background} />
        <NotificationNavigation />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background }
          }}
        />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
