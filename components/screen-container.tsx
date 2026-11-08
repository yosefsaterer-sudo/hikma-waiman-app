import { StyleSheet, View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { cn } from "@/lib/utils";
import { SchemeColors } from "@/constants/theme";
import { useThemeContext } from "@/lib/theme-provider";

export interface ScreenContainerProps extends ViewProps {
  /** Safe-area edges to apply. Bottom is normally handled by the tab bar. */
  edges?: Edge[];
  /** Optional NativeWind classes for decorative, non-layout styles. */
  className?: string;
  /** Optional NativeWind classes for decorative outer styles. */
  containerClassName?: string;
  /** Optional NativeWind classes for decorative safe-area styles. */
  safeAreaClassName?: string;
}

/**
 * Keeps the app's essential screen geometry in React Native StyleSheet rules.
 * This guarantees a full-height, themed surface on Android even if a NativeWind
 * variable cannot be resolved during a production native build.
 */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  style,
  ...props
}: ScreenContainerProps) {
  const { colorScheme } = useThemeContext();
  const colors = SchemeColors[colorScheme];

  return (
    <View
      className={cn(containerClassName)}
      style={[styles.outer, { backgroundColor: colors.background }]}
      {...props}
    >
      <SafeAreaView
        edges={edges}
        className={cn(safeAreaClassName)}
        style={styles.safeArea}
      >
        <View
          className={cn(className)}
          style={[styles.content, { backgroundColor: colors.background }, style]}
        >
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1 },
});
