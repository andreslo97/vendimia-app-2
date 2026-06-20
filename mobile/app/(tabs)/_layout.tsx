import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { colors } from "@/theme/colors";

type TabIconName = keyof typeof Ionicons.glyphMap;

const tabIcon = (name: TabIconName) =>
  function Icon({ color, size }: { color: string; size: number }) {
    return <Ionicons name={name} color={color} size={size} />;
  };

export default function TabsLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!session) return <Redirect href="/auth/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.cardDark,
          borderTopColor: colors.line
        },
        tabBarLabelStyle: {
          fontSize: 11
        }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio", tabBarIcon: tabIcon("home") }} />
      <Tabs.Screen name="discipulado/index" options={{ title: "Discipulado", tabBarIcon: tabIcon("school") }} />
      <Tabs.Screen name="prayer" options={{ title: "Oración", tabBarIcon: tabIcon("heart") }} />
      <Tabs.Screen name="events" options={{ title: "Eventos", tabBarIcon: tabIcon("calendar") }} />
      <Tabs.Screen name="more/index" options={{ title: "Más", tabBarIcon: tabIcon("menu") }} />
      <Tabs.Screen name="more/info" options={{ href: null }} />
      <Tabs.Screen name="more/profile" options={{ href: null }} />
      <Tabs.Screen name="more/admin-notifications" options={{ href: null }} />
      <Tabs.Screen name="more/admin/index" options={{ href: null }} />
      <Tabs.Screen name="more/admin/home" options={{ href: null }} />
      <Tabs.Screen name="more/admin/home-song" options={{ href: null }} />
      <Tabs.Screen name="more/admin/devotional" options={{ href: null }} />
      <Tabs.Screen name="more/admin/events" options={{ href: null }} />
      <Tabs.Screen name="more/admin/users" options={{ href: null }} />
      <Tabs.Screen name="more/admin/leadership-schedule" options={{ href: null }} />
      <Tabs.Screen name="more/admin/weekly-songs" options={{ href: null }} />
      <Tabs.Screen name="more/admin/church" options={{ href: null }} />
      <Tabs.Screen name="more/admin/system" options={{ href: null }} />
      <Tabs.Screen name="more/appointments" options={{ href: null }} />
      <Tabs.Screen name="more/appointment-responses" options={{ href: null }} />
      <Tabs.Screen name="more/leadership-schedule" options={{ href: null }} />
      <Tabs.Screen name="more/weekly-songs" options={{ href: null }} />
      <Tabs.Screen name="more/locations" options={{ href: null }} />

      <Tabs.Screen name="discipulado/devocionales" options={{ href: null }} />
      <Tabs.Screen name="discipulado/notas" options={{ href: null }} />
      <Tabs.Screen name="discipulado/material/index" options={{ href: null }} />
      <Tabs.Screen name="discipulado/material/[id]" options={{ href: null }} />
      <Tabs.Screen name="discipulado/biblia/index" options={{ href: null }} />
      <Tabs.Screen name="discipulado/biblia/[id]" options={{ href: null, tabBarStyle: { display: "none" } }} />
    </Tabs>
  );
}
