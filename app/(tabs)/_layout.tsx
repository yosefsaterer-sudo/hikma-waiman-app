import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/app-icon";
import { getNativePalette } from "@/lib/native-palette";
import { useThemeContext } from "@/lib/theme-provider";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useThemeContext();
  const palette = getNativePalette(colorScheme);
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: { height: 62 + bottomPadding, paddingTop: 8, paddingBottom: bottomPadding, borderTopColor: palette.border, backgroundColor: palette.surface, direction: "rtl" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "المحادثات", tabBarIcon: ({ color }) => <AppIcon name="chat-bubble-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="groups" options={{ title: "المجموعات", tabBarIcon: ({ color }) => <AppIcon name="groups-2" size={25} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "الإعدادات", tabBarIcon: ({ color }) => <AppIcon name="settings" size={24} color={color} /> }} />
    </Tabs>
  );
}
