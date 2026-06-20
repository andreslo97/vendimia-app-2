import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ImageBackground, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getHomeData, HomeData } from "@/services/homeService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { runRefresh } from "@/utils/refresh";
import { HomeSongPreview } from "@/components/HomeSongPreview";

const vendimiaLogo = require("@/assets/vendimia-logo-orange.png");

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => setData(await getHomeData());

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await runRefresh(load).finally(() => setRefreshing(false));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  const banner = data?.banners[0];
  const quickSection = data?.sections.find((item) => item.section_key === "quick_links");
  const dailyDevotionalSection = data?.sections.find((item) => item.section_key === "daily_devotional");
  const eventsSection = data?.sections.find((item) => item.section_key === "upcoming_events") ?? data?.sections.find((item) => item.section_key === "next_event");
  const openMaps = async (url?: string | null) => {
    if (!url) return;
    await Linking.openURL(url);
  };

  return (
    <ScrollView
      alwaysBounceVertical
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 }]}
      refreshControl={
        <RefreshControl
          colors={[colors.gold]}
          onRefresh={refresh}
          progressBackgroundColor={colors.cardDark}
          progressViewOffset={insets.top + 8}
          refreshing={refreshing}
          tintColor={colors.gold}
        />
      }
      style={styles.screen}
    >
      {data?.header ? (
        <View style={styles.heroHeader}>
          <View style={styles.logoMark}>
            <Image source={vendimiaLogo} style={styles.logoImage} />
          </View>
          {data.header.app_label ? <Text style={styles.brand}>{data.header.app_label}</Text> : null}
          {data.header.title ? <Text style={styles.welcome}>{data.header.title}</Text> : null}
          {data.header.subtitle ? <Text style={styles.subtitle}>{data.header.subtitle}</Text> : null}
        </View>
      ) : null}

      {banner ? (
        <ImageBackground source={banner.image_url ? { uri: banner.image_url } : undefined} resizeMode="cover" style={[styles.featureCard, { backgroundColor: banner.background_color ?? colors.cardDark }]}>
          <View style={styles.featureScrim} />
          <View style={styles.featureContent}>
            <View style={styles.featureTop}>
              <View style={styles.featureIcon}>
                <Image source={vendimiaLogo} style={styles.featureLogoImage} />
              </View>
              {banner.badge_text ? (
                <View style={[styles.badge, { backgroundColor: "rgba(0,0,0,0.32)" }]}>
                  <Text style={styles.badgeText}>{banner.badge_text}</Text>
                </View>
              ) : null}
            </View>
            {banner.title ? <Text style={styles.featureTitle}>{banner.title}</Text> : null}
            {banner.subtitle ? <Text style={styles.featureSubtitle}>{banner.subtitle}</Text> : null}
            {banner.button_text && banner.button_route ? (
              <Pressable onPress={() => router.push(banner.button_route as never)} style={[styles.featureButton, { backgroundColor: banner.accent_color ?? colors.gold }]}>
                <Text style={styles.featureButtonText}>{banner.button_text}</Text>
                <Ionicons name="chevron-forward" color={colors.text} size={17} />
              </Pressable>
            ) : null}
          </View>
        </ImageBackground>
      ) : null}

      {data?.songPreview ? <HomeSongPreview song={data.songPreview} /> : null}

      {quickSection && data?.quickLinks.length ? (
        <View style={styles.section}>
          {quickSection.title ? <Text style={styles.sectionTitle}>{quickSection.title}</Text> : null}
          <View style={styles.quickGrid}>
            {data.quickLinks.map((link, index) => (
              <Pressable key={`${link.title}-${index}`} onPress={() => link.route && router.push(link.route as never)} style={[styles.quickCard, { backgroundColor: link.background_color ?? colors.cardDark }]}>
                <Ionicons name={(link.icon_name ?? "apps") as keyof typeof Ionicons.glyphMap} color={link.accent_color ?? colors.gold} size={27} />
                {link.title ? <Text numberOfLines={1} style={styles.quickText}>{link.title}</Text> : null}
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {data?.dailyDevotional ? (
        <View style={styles.section}>
          {dailyDevotionalSection?.title ? <Text style={styles.sectionTitle}>{dailyDevotionalSection.title}</Text> : null}
          <Pressable
            onPress={() => router.push("/(tabs)/discipulado/devocionales" as never)}
            style={({ pressed }) => [styles.devotionalCard, pressed && styles.cardPressed]}
          >
            <View style={styles.devotionalIcon}>
              <Ionicons name="sunny" color={colors.background} size={24} />
            </View>
            <View style={styles.devotionalContent}>
              <Text numberOfLines={1} style={styles.devotionalTitle}>{data.dailyDevotional.title}</Text>
              <Text numberOfLines={2} style={styles.devotionalVerse}>{data.dailyDevotional.verse}</Text>
            </View>
            <Ionicons name="chevron-forward" color={colors.gold} size={22} />
          </Pressable>
        </View>
      ) : null}

      {eventsSection && data?.upcomingEvents.length ? (
        <View style={styles.section}>
          {eventsSection.title ? <Text style={styles.sectionTitle}>{eventsSection.title}</Text> : null}
          <View style={styles.eventGrid}>
            {data.upcomingEvents.slice(0, 2).map((event, index) => (
              <Pressable key={`${event.id ?? event.title}-${index}`} disabled={!event.maps_url} onPress={() => openMaps(event.maps_url)} style={styles.eventPressable}>
                <ImageBackground source={event.image_url ? { uri: event.image_url } : undefined} resizeMode="cover" style={[styles.eventCard, { backgroundColor: event.background_color ?? colors.cardGray }]}>
                  <View style={styles.eventScrim} />
                  <View style={styles.eventContent}>
                    {event.event_date ? (
                      <View style={styles.datePill}>
                        <Ionicons name="calendar" color={colors.gold} size={14} />
                        <Text style={styles.dateText}>{event.event_date}</Text>
                      </View>
                    ) : null}
                    <View>
                      {event.title ? <Text style={styles.eventTitle}>{event.title}</Text> : null}
                      {event.event_time ? <Text style={styles.eventMeta}>{event.event_time}</Text> : null}
                      {event.location ? <Text style={styles.eventMeta}>{event.location}</Text> : null}
                    </View>
                  </View>
                </ImageBackground>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {data?.dailyWord ? (
        <View style={styles.wordCard}>
          {data.dailyWord.verse ? <Text style={styles.quote}>{data.dailyWord.verse}</Text> : null}
          {data.dailyWord.reference ? <Text style={[styles.reference, { color: data.dailyWord.accent_color ?? colors.gold }]}>{data.dailyWord.reference}</Text> : null}
          {data.dailyWord.reflection ? <Text style={styles.body}>{data.dailyWord.reflection}</Text> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { paddingHorizontal: 20, gap: 18 },
  heroHeader: { width: "100%", alignItems: "center", justifyContent: "center", gap: 4 },
  logoMark: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoImage: { width: 68, height: 68, resizeMode: "cover" },
  brand: { width: "100%", color: colors.text, fontSize: 29, fontFamily: fonts.black, letterSpacing: 0, textAlign: "center" },
  welcome: { width: "100%", color: colors.text, fontSize: 17, fontFamily: fonts.semiBold, marginTop: 4, textAlign: "center" },
  subtitle: { width: "100%", color: colors.textSecondary, fontSize: 15, fontFamily: fonts.regular, textAlign: "center", lineHeight: 21 },
  featureCard: { minHeight: 164, borderRadius: 18, padding: 18, overflow: "hidden", borderWidth: 1, borderColor: colors.line, justifyContent: "space-between" },
  featureScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.26)" },
  featureContent: { flex: 1, justifyContent: "space-between" },
  featureTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  featureIcon: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  featureLogoImage: { width: 46, height: 46, resizeMode: "cover" },
  badge: { borderRadius: 999, paddingHorizontal: 12, minHeight: 26, justifyContent: "center" },
  badgeText: { color: colors.text, fontSize: 12, fontFamily: fonts.bold },
  featureTitle: { color: colors.text, fontSize: 28, lineHeight: 31, fontFamily: fonts.black, maxWidth: "78%" },
  featureSubtitle: { color: colors.text, fontSize: 14, fontFamily: fonts.bold },
  featureButton: { minHeight: 42, borderRadius: 999, alignSelf: "center", paddingHorizontal: 24, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: -4 },
  featureButtonText: { color: colors.text, fontSize: 15, fontFamily: fonts.extraBold },
  section: { gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.bold },
  quickGrid: { flexDirection: "row", gap: 10 },
  quickCard: { flex: 1, minHeight: 78, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 6 },
  quickText: { color: colors.text, fontSize: 11, fontFamily: fonts.medium, maxWidth: "100%" },
  devotionalCard: { minHeight: 88, borderRadius: 16, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.gold, padding: 14, flexDirection: "row", alignItems: "center", gap: 13 },
  cardPressed: { opacity: 0.86 },
  devotionalIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  devotionalContent: { flex: 1, gap: 4 },
  devotionalTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.extraBold },
  devotionalVerse: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontFamily: fonts.medium },
  eventGrid: { flexDirection: "row", gap: 12 },
  eventPressable: { flex: 1 },
  eventCard: { flex: 1, minHeight: 178, borderRadius: 16, padding: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.line, justifyContent: "space-between" },
  eventScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.34)" },
  eventContent: { flex: 1, justifyContent: "space-between" },
  datePill: { alignSelf: "flex-start", borderRadius: 8, backgroundColor: colors.text, paddingHorizontal: 8, minHeight: 26, flexDirection: "row", alignItems: "center", gap: 5 },
  dateText: { color: colors.background, fontSize: 10, fontFamily: fonts.black },
  eventTitle: { color: colors.text, fontSize: 18, lineHeight: 20, fontFamily: fonts.black },
  eventMeta: { color: colors.textSecondary, fontSize: 11, fontFamily: fonts.semiBold },
  wordCard: { borderRadius: 16, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 10 },
  quote: { color: colors.text, fontSize: 17, fontFamily: fonts.semiBold, lineHeight: 25 },
  reference: { fontSize: 13, fontFamily: fonts.bold },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 }
});
