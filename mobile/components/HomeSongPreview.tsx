import { Ionicons } from "@expo/vector-icons";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { HomeSongPreview as HomeSongPreviewData } from "@/services/homeService";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type Props = {
  song: HomeSongPreviewData;
};

const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
};

export function HomeSongPreview({ song }: Props) {
  const player = useAudioPlayer(song.audio_preview_url, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const stoppingRef = useRef(false);
  const configuredDuration =
    song.preview_duration_seconds && song.preview_duration_seconds > 0
      ? song.preview_duration_seconds
      : null;
  const effectiveDuration =
    configuredDuration && status.duration > 0
      ? Math.min(configuredDuration, status.duration)
      : configuredDuration ?? status.duration;
  const progress = effectiveDuration > 0 ? Math.min(1, status.currentTime / effectiveDuration) : 0;

  useEffect(() => {
    player.volume = 1;
    setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: false
    }).catch(() => undefined);
  }, [player]);

  useEffect(() => {
    if (!configuredDuration || status.currentTime < effectiveDuration || stoppingRef.current) return;

    stoppingRef.current = true;
    player.pause();
    player.seekTo(0).finally(() => {
      stoppingRef.current = false;
    });
  }, [configuredDuration, effectiveDuration, player, status.currentTime]);

  const togglePlayback = async () => {
    if (!status.isLoaded) {
      Alert.alert("Audio no disponible", "El fragmento todavía no ha cargado. Revisa que la URL del audio sea pública y corresponda a un archivo MP3 o M4A.");
      return;
    }

    if (status.playing) {
      player.pause();
      return;
    }

    if ((effectiveDuration > 0 && status.currentTime >= effectiveDuration - 0.2) || status.didJustFinish) {
      await player.seekTo(0);
    }

    player.play();
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityLabel={status.playing ? `Pausar ${song.title}` : `Reproducir ${song.title}`}
        onPress={togglePlayback}
        style={styles.playButton}
      >
        {status.isBuffering ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <Ionicons name={status.playing ? "pause" : "play"} color={colors.background} size={24} />
        )}
      </Pressable>

      {song.cover_url ? (
        <Image source={{ uri: song.cover_url }} style={styles.cover} />
      ) : (
        <View style={styles.coverFallback}>
          <Ionicons name="musical-note" color={colors.gold} size={20} />
        </View>
      )}

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.songLine}>
          <Text style={styles.title}>{song.title}</Text>
          {song.artist ? <Text style={styles.artist}> · {song.artist}</Text> : null}
        </Text>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.time}>
            {formatTime(effectiveDuration > 0 ? Math.min(status.currentTime, effectiveDuration) : status.currentTime)}/{effectiveDuration > 0 ? formatTime(effectiveDuration) : "--:--"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 76, borderRadius: 16, backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 },
  playButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  cover: { width: 46, height: 46, borderRadius: 8 },
  coverFallback: { width: 46, height: 46, borderRadius: 8, backgroundColor: colors.cardGray, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, gap: 9 },
  songLine: { color: colors.text, fontSize: 15, fontFamily: fonts.regular },
  title: { color: colors.text, fontFamily: fonts.extraBold },
  artist: { color: colors.textSecondary, fontFamily: fonts.regular },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.cardGray, overflow: "hidden" },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: colors.gold },
  time: { color: colors.textSecondary, fontSize: 10, fontFamily: fonts.medium }
});
