import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { I18nManager } from "react-native";
import { useEffect } from "react";

import { MessengerProvider } from "@/lib/messenger-store";
import { ensureStorageDirectories } from "@/lib/storage-manager";
import { configureNotificationChannel } from "@/lib/notification-service";
import { ThemeProvider, useThemeContext } from "@/lib/theme-provider";
import { startAgent } from "@/lib/agent-service";

export default function RootLayout() {
  useEffect(() => {
    configureNotificationChannel().catch(() => undefined);
    ensureStorageDirectories().catch(() => undefined);
    startAgent();

    if (typeof window === "undefined" || !window.addEventListener) return;
    const suppressOptionalFontTimeout = (event: Event) => {
      const reason = (event as { reason?: unknown }).reason;
      if (reason instanceof Error && /6000ms timeout exceeded/.test(reason.message)) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", suppressOptionalFontTimeout);
    return () => window.removeEventListener("unhandledrejection", suppressOptionalFontTimeout);
  }, []);

  return (
    <ThemeProvider>
      <ThemedRoot />
    </ThemeProvider>
  );
}

function ThemedRoot() {
  const { colorScheme } = useThemeContext();
  useEffect(() => {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    const rtlManager = I18nManager as typeof I18nManager & { swapLeftAndRightInRTL?: (swap: boolean) => void };
    rtlManager.swapLeftAndRightInRTL?.(false);
  }, []);
  return (
    <MessengerProvider>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="share" options={{ presentation: "modal" }} />
        <Stack.Screen name="new-chat" options={{ presentation: "modal" }} />
        <Stack.Screen name="server-settings" options={{ presentation: "modal" }} />
        <Stack.Screen name="notifications" options={{ presentation: "modal" }} />
        <Stack.Screen name="privacy-security" options={{ presentation: "modal" }} />
        <Stack.Screen name="about" options={{ presentation: "modal" }} />
        <Stack.Screen name="new-group" options={{ presentation: "modal" }} />
        <Stack.Screen name="account" options={{ presentation: "modal" }} />
        <Stack.Screen name="appearance" options={{ presentation: "modal" }} />
        <Stack.Screen name="download-settings" options={{ presentation: "modal" }} />
        <Stack.Screen name="storage-settings" options={{ presentation: "modal" }} />
        <Stack.Screen name="downloaded-media" options={{ presentation: "modal" }} />
        <Stack.Screen name="sign-in" options={{ presentation: "modal" }} />
        <Stack.Screen name="sign-up" options={{ presentation: "modal" }} />
        <Stack.Screen name="account-recovery" options={{ presentation: "modal" }} />
        <Stack.Screen name="change-password" options={{ presentation: "modal" }} />
      </Stack>
    </MessengerProvider>
  );
}
