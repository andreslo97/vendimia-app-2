import { createElement } from "react";
import { StyleSheet, View } from "react-native";

type PdfViewerProps = {
  url: string;
};

export function PdfViewer({ url }: PdfViewerProps) {
  return (
    <View style={styles.viewer}>
      {createElement("iframe", {
        src: url,
        style: {
          border: "0",
          height: "100%",
          width: "100%"
        },
        title: "PDF"
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  viewer: { flex: 1 }
});
