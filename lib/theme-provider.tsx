import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance, View } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";

import { SchemeColors, type ColorScheme } from "@/constants/theme";
import { buildThemeVariables } from "@/lib/theme-variables";
import { getCachedManagedMedia } from "@/lib/media-cache";
import { privateServerClient } from "@/lib/private-server-client";

export type ThemePreference = "system" | ColorScheme;
export type ChatBackground = "mist" | "sand" | "sky" | "night" | "custom";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  chatBackground: ChatBackground;
  setChatBackground: (background: ChatBackground) => void;
  chatBackgroundUri: string | null;
  setChatBackgroundImage: (uri: string) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_PREFERENCE_KEY = "messenger.theme.preference";
const CHAT_BACKGROUND_KEY = "messenger.chat.background";
const CHAT_BACKGROUND_URI_KEY = "messenger.chat.background.uri";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [systemScheme, setSystemScheme] = useState<ColorScheme>(
    (Appearance.getColorScheme() ?? "light") as ColorScheme,
  );
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const [chatBackground, setChatBackgroundState] = useState<ChatBackground>("mist");
  const [chatBackgroundUri, setChatBackgroundUri] = useState<string | null>(null);
  const colorScheme = themePreference === "system" ? systemScheme : themePreference;

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: nextScheme }) => {
      setSystemScheme((nextScheme ?? "light") as ColorScheme);
    });
    return () => subscription.remove();
  }, []);

  const applyScheme = useCallback((scheme: ColorScheme) => {
    nativewindColorScheme.set(scheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");
      const palette = SchemeColors[scheme];
      Object.entries(palette).forEach(([token, value]) => root.style.setProperty(`--color-${token}`, value));
    }
  }, []);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
    AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference).catch(() => undefined);
  }, []);
  const setColorScheme = useCallback((scheme: ColorScheme) => setThemePreference(scheme), [setThemePreference]);
  const setChatBackground = useCallback((background: ChatBackground) => {
    setChatBackgroundState(background);
    AsyncStorage.setItem(CHAT_BACKGROUND_KEY, background).catch(() => undefined);
    if (background !== "custom") void privateServerClient.deleteProfileMedia("background").catch(() => undefined);
  }, []);
  const setChatBackgroundImage = useCallback(async (uri: string) => {
    const { copyToManagedDirectory } = await import("@/lib/media-cache");
    const localUri = await copyToManagedDirectory(uri, "backgrounds", "chat-background.jpg");
    setChatBackgroundUri(localUri);
    setChatBackgroundState("custom");
    await AsyncStorage.setItem(CHAT_BACKGROUND_URI_KEY, localUri);
    await AsyncStorage.setItem(CHAT_BACKGROUND_KEY, "custom");
    await privateServerClient.uploadProfileMedia("background", uri).catch(() => undefined);
  }, []);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(THEME_PREFERENCE_KEY), AsyncStorage.getItem(CHAT_BACKGROUND_KEY), AsyncStorage.getItem(CHAT_BACKGROUND_URI_KEY)])
      .then(([storedTheme, storedBackground, storedUri]) => {
        if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") setThemePreferenceState(storedTheme);
        if (storedBackground === "mist" || storedBackground === "sand" || storedBackground === "sky" || storedBackground === "night" || storedBackground === "custom") setChatBackgroundState(storedBackground);
        if (storedUri) setChatBackgroundUri(storedUri);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void privateServerClient.getProfile().then(async ({ profile }) => {
      if (!profile.backgroundUrl || chatBackgroundUri) return;
      const cached = await getCachedManagedMedia({ id: "profile-background", name: "chat-background.jpg", uri: profile.backgroundUrl }, "backgrounds", "chat-background.jpg");
      if (cached) { setChatBackgroundUri(cached); setChatBackgroundState("custom"); await AsyncStorage.setItem(CHAT_BACKGROUND_URI_KEY, cached); await AsyncStorage.setItem(CHAT_BACKGROUND_KEY, "custom"); }
    }).catch(() => undefined);
  }, [chatBackgroundUri]);

  useEffect(() => { applyScheme(colorScheme); }, [applyScheme, colorScheme]);

  const themeVariables = useMemo(() => vars(buildThemeVariables(SchemeColors[colorScheme])), [colorScheme]);
  const value = useMemo(() => ({ colorScheme, setColorScheme, themePreference, setThemePreference, chatBackground, setChatBackground, chatBackgroundUri, setChatBackgroundImage }), [chatBackground, chatBackgroundUri, colorScheme, setChatBackground, setChatBackgroundImage, setColorScheme, setThemePreference, themePreference]);

  return <ThemeContext.Provider value={value}><View style={[{ flex: 1, direction: "rtl" }, themeVariables]}>{children}</View></ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}
