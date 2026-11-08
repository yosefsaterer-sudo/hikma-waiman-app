import AsyncStorage from "@react-native-async-storage/async-storage";

import { serverConfigStore } from "@/lib/server-config";
import { validateServerSettings } from "@/lib/server-validation";

const ACCOUNT_SESSION_KEY = "messenger.account.session";
export const DEFAULT_MESSENGER_SERVER = "";
export const MESSENGER_SERVER_NAME = "خادم حكمة وإيمان";

export type AccountSession = {
  id: string;
  username: string;
};

type AuthResponse = {
  account: AccountSession;
  token: string;
  expiresAt: string;
  recoveryCode?: string;
  error?: string;
};

function normalizeBaseUrl(baseUrl: string) {
  const validation = validateServerSettings({ baseUrl, apiPath: "/v1/health" });
  if (!validation.valid) throw new Error(validation.message);
  return validation.normalizedBaseUrl;
}

async function postPublicAuth(path: string, baseUrl: string, body: Record<string, string>) {
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({ error: "استجابة الخادم غير صالحة." })) as AuthResponse;
  if (!response.ok || !data.token || !data.account) throw new Error(data.error || "تعذر إكمال طلب الحساب.");
  return data;
}

async function saveSession(baseUrl: string, result: AuthResponse) {
  const current = await serverConfigStore.load();
  await serverConfigStore.save({ ...current, baseUrl: normalizeBaseUrl(baseUrl), token: result.token });
  await AsyncStorage.setItem(ACCOUNT_SESSION_KEY, JSON.stringify(result.account));
}

export const messengerAuth = {
  async register(baseUrl: string, username: string, password: string) {
    const result = await postPublicAuth("/v1/auth/register", baseUrl, { username, password });
    await saveSession(baseUrl, result);
    return { account: result.account, recoveryCode: result.recoveryCode || "" };
  },
  async login(baseUrl: string, username: string, password: string) {
    const result = await postPublicAuth("/v1/auth/login", baseUrl, { username, password });
    await saveSession(baseUrl, result);
    return result.account;
  },
  async recover(baseUrl: string, username: string, recoveryCode: string, password: string) {
    const result = await postPublicAuth("/v1/auth/recover", baseUrl, { username, recoveryCode, password });
    await saveSession(baseUrl, result);
    return result.account;
  },
  async changePassword(currentPassword: string, newPassword: string) {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (!validation.valid) throw new Error(validation.message);
    const response = await fetch(`${validation.normalizedBaseUrl}/v1/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${settings.token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json().catch(() => ({ error: "استجابة الخادم غير صالحة." })) as { success?: boolean; token?: string; error?: string };
    if (!response.ok || !data.success || !data.token) throw new Error(data.error || "تعذر تغيير كلمة المرور.");
    await serverConfigStore.save({ ...settings, baseUrl: validation.normalizedBaseUrl, token: data.token });
  },
  async loadSession() {
    const raw = await AsyncStorage.getItem(ACCOUNT_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AccountSession;
    } catch {
      await AsyncStorage.removeItem(ACCOUNT_SESSION_KEY);
      return null;
    }
  },
  async logout() {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (validation.valid && settings.token) {
      await fetch(`${validation.normalizedBaseUrl}/v1/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${settings.token}` },
      }).catch(() => undefined);
    }
    await serverConfigStore.save({ ...settings, token: "" });
    await AsyncStorage.removeItem(ACCOUNT_SESSION_KEY);
  },
  async clearSavedServerData() {
    await Promise.all([serverConfigStore.clear(), AsyncStorage.removeItem(ACCOUNT_SESSION_KEY)]);
  },
};
