import { useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { colors } from "@/theme/colors";

type WebContentViewerProps = {
  url: string;
};

const hideEmbeddedBottomNavigationScript = `
  (function () {
    if (window.__vendimiaHideBottomNavigation) return true;
    window.__vendimiaHideBottomNavigation = true;

    var style = document.createElement("style");
    style.innerHTML = [
      "body { padding-bottom: 0 !important; }",
      "main { padding-bottom: 18px !important; }",
      "nav[aria-label*='bottom' i],",
      "nav[class*='bottom' i],",
      "[data-testid*='bottom' i],",
      "[class*='bottomNavigation' i],",
      "[class*='BottomNavigation' i],",
      "[class*='bottom-nav' i],",
      "[class*='BottomNav' i] {",
      "  display: none !important;",
      "  visibility: hidden !important;",
      "  height: 0 !important;",
      "}"
    ].join("\\n");
    document.head.appendChild(style);

    var labels = ["inicio", "biblia", "planes", "videos"];

    var hasYouVersionBottomLabels = function (element) {
      var text = (element.innerText || element.textContent || "").toLowerCase();
      var matches = 0;

      for (var i = 0; i < labels.length; i += 1) {
        if (text.indexOf(labels[i]) >= 0) matches += 1;
      }

      return matches >= 3;
    };

    var hideElement = function (element) {
      element.style.setProperty("display", "none", "important");
      element.style.setProperty("visibility", "hidden", "important");
      element.style.setProperty("height", "0", "important");
      element.style.setProperty("min-height", "0", "important");
      element.style.setProperty("max-height", "0", "important");
      element.style.setProperty("overflow", "hidden", "important");
      element.setAttribute("aria-hidden", "true");
    };

    var hideFixedBottomBars = function () {
      var nodes = document.querySelectorAll("nav, footer, [role='navigation'], div, section");
      for (var i = 0; i < nodes.length; i += 1) {
        var element = nodes[i];
        var rect = element.getBoundingClientRect();
        var computed = window.getComputedStyle(element);
        var isFixedBottom =
          (computed.position === "fixed" || computed.position === "sticky" || computed.position === "absolute") &&
          rect.bottom >= window.innerHeight - 12 &&
          rect.height > 36 &&
          rect.height < 180 &&
          rect.width >= window.innerWidth * 0.65;
        var isYouVersionBottomBar =
          rect.bottom >= window.innerHeight - 18 &&
          rect.height > 45 &&
          rect.height < 180 &&
          rect.width >= window.innerWidth * 0.75 &&
          hasYouVersionBottomLabels(element);

        if (isFixedBottom || isYouVersionBottomBar) {
          hideElement(element);
        }
      }
    };

    hideFixedBottomBars();
    new MutationObserver(hideFixedBottomBars).observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    window.setInterval(hideFixedBottomBars, 600);
  })();
  true;
`;

export function WebContentViewer({ url }: WebContentViewerProps) {
  const webViewRef = useRef<WebView>(null);

  return (
    <WebView
      ref={webViewRef}
      injectedJavaScriptBeforeContentLoaded={hideEmbeddedBottomNavigationScript}
      injectedJavaScript={hideEmbeddedBottomNavigationScript}
      onLoadEnd={() => {
        webViewRef.current?.injectJavaScript(hideEmbeddedBottomNavigationScript);
      }}
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
