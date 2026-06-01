import { createElement } from "react";
import { StyleSheet, View } from "react-native";

type WebContentViewerProps = {
  url: string;
};

export function WebContentViewer({ url }: WebContentViewerProps) {
  return (
    <View style={styles.viewer}>
      {createElement("iframe", {
        src: url,
        style: {
          border: "0",
          height: "100%",
          width: "100%"
        },
        title: "Contenido"
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  viewer: { flex: 1 }
});
