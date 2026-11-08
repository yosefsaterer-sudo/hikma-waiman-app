import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { ServerSettings } from "@/lib/server-validation";

const PUBLIC_SETTINGS_KEY = "messenger.server.public";
const TOKEN_KEY = "messenger.server.token";

type StoredPublicSettings = Omit<ServerSettings, "token">;
type SettingsListener = () => void;

const settingsListeners = new Set<SettingsListener>();

function notifySettingsChanged() {
  settingsListeners.forEach((listener) => listener());
}

async function setSecret(value: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.sessionStorage.setItem(TOKEN_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, value);
}

async function getSecret() {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" ? window.sessionStorage.getItem(TOKEN_KEY) : null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export const serverConfigStore = {
  async load(): Promise<ServerSettings> {
    const [stored, token] = await Promise.all([AsyncStorage.getItem(PUBLIC_SETTINGS_KEY), getSecret()]);
    const publicSettings = stored ? (JSON.parse(stored) as StoredPublicSettings) : { baseUrl: "", apiPath: "/v1/health", mediaPath: "/v1/media", conversationsPath: "/v1/conversations", realtimePath: "/v1/realtime", icePath: "/v1/calls/ice" };
    return { ...publicSettings, apiPath: publicSettings.apiPath || "/v1/health", mediaPath: publicSettings.mediaPath || "/v1/media", conversationsPath: publicSettings.conversationsPath || "/v1/conversations", realtimePath: publicSettings.realtimePath || "/v1/realtime", icePath: publicSettings.icePath || "/v1/calls/ice", token: token ?? "" };
  },
  async save(settings: ServerSettings) {
    const { token = "", ...publicSettings } = settings;
    await AsyncStorage.setItem(PUBLIC_SETTINGS_KEY, JSON.stringify(publicSettings));
    if (token) await setSecret(token);
    if (!token) {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.sessionStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    }
    notifySettingsChanged();
  },
  async clear() {
    await AsyncStorage.removeItem(PUBLIC_SETTINGS_KEY);
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.sessionStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    notifySettingsChanged();
  },
  subscribe(listener: SettingsListener) {
    settingsListeners.add(listener);
    return () => settingsListeners.delete(listener);
  },
};
