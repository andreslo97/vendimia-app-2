import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { colors } from "@/theme/colors";

type WebContentViewerProps = {
  url: string;
};

export function WebContentViewer({ url }: WebContentViewerProps) {
  return (
    <WebView
      originWhitelist={["*"]}
      source={{ uri: url }}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.gold} />
        </View>
      )}
      style={styles.viewer}
    />
  );
}

const styles = StyleSheet.create({
  viewer: { flex: 1, backgroundColor: colors.background },
  loading: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }
});
