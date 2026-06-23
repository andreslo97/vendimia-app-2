import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { colors } from "@/theme/colors";

export default function IndexScreen() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!session) return <Redirect href="/auth/login" />;
  if (profile && (!profile.church_attendance_time?.trim() || profile.is_being_discipled === null)) {
    return <Redirect href="/auth/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
