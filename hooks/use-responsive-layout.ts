import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 62;

type ResponsiveLayoutOptions = {
  hasTabBar?: boolean;
};

export function useResponsiveLayout({ hasTabBar = true }: ResponsiveLayoutOptions = {}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isSmallPhone = width < 380;
  const isCompact = width < 460;
  const screenPadding = isSmallPhone ? 16 : 20;
  const bottomInset = Math.max(insets.bottom, Platform.OS === "ios" ? 10 : 6);

  return {
    width,
    height,
    insets,
    isCompact,
    isSmallPhone,
    screenPadding,
    contentWidth: Math.max(0, width - screenPadding * 2),
    topPadding: insets.top + (isSmallPhone ? 18 : 26),
    bottomPadding: (hasTabBar ? TAB_BAR_HEIGHT : 0) + bottomInset + 24,
  };
}
