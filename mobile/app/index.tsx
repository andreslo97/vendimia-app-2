import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { colors } from "@/theme/colors";

export default function IndexScreen() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return <Redirect href={session ? "/(tabs)" : "/auth/login"} />;
}
