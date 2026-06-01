import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  Montserrat_900Black,
  useFonts
} from "@expo-google-fonts/montserrat";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
