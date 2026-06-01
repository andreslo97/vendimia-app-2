import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { colors } from "@/theme/colors";

type PdfViewerProps = {
  url: string;
};

export function PdfViewer({ url }: PdfViewerProps) {
  const sourceUrl = Platform.OS === "android" ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}` : url;

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ uri: sourceUrl }}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.webLoading}>
          <ActivityIndicator color={colors.gold} />
        </View>
      )}
      style={styles.viewer}
    />
  );
}

const styles = StyleSheet.create({
  viewer: { flex: 1, backgroundColor: colors.background },
  webLoading: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }
});
