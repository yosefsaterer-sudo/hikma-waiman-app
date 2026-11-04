import { serverConfigStore } from "@/lib/server-config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildAccountsUrl, buildConversationActionUrl, buildConversationMessagesUrl, buildConversationsUrl, buildDirectConversationUrl, buildIceServersUrl, buildMessageActionUrl, buildRealtimeUrl, buildSendMessageUrl, validateServerSettings } from "@/lib/server-validation";
import { normalizeConversation, parseItems } from "@/lib/private-server-response";

const DEVICE_ID_KEY = "messenger.trial.device-id";

async function getDeviceId() {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const created = `device-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

export type ServerMedia = { mediaId: string; url: string; mimeType: string; size?: number; name?: string };
export type ServerMessage = { id: string; conversationId: string; text: string; createdAt: string; senderId: string; media?: ServerMedia[]; readBy?: string[] };
export type RealtimeEvent = { type: "message.created" | "message.read" | "media.ready" | "call.offer" | "call.answer" | "call.ice-candidate" | "call.ended"; conversationId: string; payload: Record<string, unknown> };
export type IceServer = { urls: string[]; username?: string; credential?: string };
export type ServerAccount = { id: string; username: string; avatarUrl?: string | null };
export type ServerConversation = { id: string; name: string; avatarUrl?: string | null; otherUsername?: string; initials?: string; color?: string; kind?: "direct" | "group"; participants?: number; unread?: number; verified?: boolean; lastMessage?: string; time?: string };

async function authHeaders(token?: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "X-Device-Id": await getDeviceId() };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export const privateServerClient = {
  async listAccounts() {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (!validation.valid) throw new Error(validation.message);
    const response = await fetch(buildAccountsUrl({ baseUrl: validation.normalizedBaseUrl }), { headers: await authHeaders(settings.token) });
    if (!response.ok) throw new Error(`تعذر جلب الحسابات: ${response.status}`);
    const payload = await response.json();
    return parseItems<ServerAccount>(payload).filter((account) => Boolean(account?.id && account?.username));
  },
  async createDirectConversation(username: string) {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (!validation.valid) throw new Error(validation.message);
    const response = await fetch(buildDirectConversationUrl({ ...settings, baseUrl: validation.normalizedBaseUrl }), { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders(settings.token)) }, body: JSON.stringify({ username }) });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "تعذر إنشاء المحادثة الخاصة." })) as { error?: string };
      throw new Error(error.error || "تعذر إنشاء المحادثة الخاصة.");
    }
    const payload = await response.json() as Partial<ServerConversation> & { id: string; otherUsername?: string };
    return normalizeConversation(payload);
  },
  async listConversations() {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (!validation.valid) throw new Error(validation.message);
    const response = await fetch(buildConversationsUrl({ ...settings, baseUrl: validation.normalizedBaseUrl }), { headers: await authHeaders(settings.token) });
    if (!response.ok) throw new Error(`تعذر جلب المحادثات: ${response.status}`);
    const payload = await response.json();
    return parseItems<Partial<ServerConversation> & { id: string; otherUsername?: string }>(payload).map(normalizeConversation);
  },
  async listMessages(conversationId: string, cursor?: string) {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (!validation.valid) throw new Error(validation.message);
    const response = await fetch(buildConversationMessagesUrl({ ...settings, baseUrl: validation.normalizedBaseUrl }, conversationId, cursor), { headers: await authHeaders(settings.token) });
    if (!response.ok) throw new Error(`تعذر جلب الرسائل: ${response.status}`);
    return response.json() as Promise<{ items: ServerMessage[]; nextCursor?: string }>;
  },
  async sendMessage(conversationId: string, text: string, mediaIds: string[] = []) {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (!validation.valid) throw new Error(validation.message);
    const response = await fetch(buildSendMessageUrl({ ...settings, baseUrl: validation.normalizedBaseUrl }, conversationId), { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders(settings.token)) }, body: JSON.stringify({ text, mediaIds }) });
    if (!response.ok) throw new Error(`تعذر إرسال الرسالة: ${response.status}`);
    return response.json() as Promise<ServerMessage>;
  },
  async deleteConversation(conversationId: string) {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (!validation.valid) throw new Error(validation.message);
    const response = await fetch(buildConversationActionUrl({ baseUrl: validation.normalizedBaseUrl, conversationsPath: settings.conversationsPath }, conversationId), { method: "DELETE", headers: await authHeaders(settings.token) });
    if (!response.ok) throw new Error(`تعذر حذف المحادثة من الخادم: ${response.status}`);
    return response.json() as Promise<{ success: boolean; deletedForMe?: boolean }>;
  },
  async deleteMessage(messageId: string) {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (!validation.valid) throw new Error(validation.message);
    const response = await fetch(buildMessageActionUrl({ baseUrl: validation.normalizedBaseUrl }, messageId), { method: "DELETE", headers: await authHeaders(settings.token) });
    if (!response.ok) throw new Error(`تعذر حذف الرسالة من الخادم: ${response.status}`);
    return response.json() as Promise<{ success: boolean; deletedForEveryone?: boolean }>;
  },
  async markMessageRead(messageId: string) {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (!validation.valid) throw new Error(validation.message);
    const response = await fetch(buildMessageActionUrl({ baseUrl: validation.normalizedBaseUrl }, messageId, "read"), { method: "POST", headers: await authHeaders(settings.token) });
    if (!response.ok) throw new Error(`تعذر تسجيل قراءة الرسالة: ${response.status}`);
    return response.json();
  },
  async getProfile() {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (!validation.valid) throw new Error(validation.message);
    const response = await fetch(`${validation.normalizedBaseUrl}/v1/auth/profile`, { headers: await authHeaders(settings.token) });
    if (!response.ok) throw new Error(`تعذر جلب الملف الشخصي: ${response.status}`);
    const payload = await response.json() as { profile: { avatarUrl: string | null; backgroundUrl: string | null } };
    const absolute = (url: string | null) => url && url.startsWith("/") ? `${validation.normalizedBaseUrl}${url}` : url;
    return { profile: { avatarUrl: absolute(payload.profile.avatarUrl), backgroundUrl: absolute(payload.profile.backgroundUrl) } };
  },
  async uploadProfileMedia(kind: "avatar" | "background", uri: string) {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (!validation.valid) throw new Error(validation.message);
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", { uri, name: `${kind}.jpg`, type: "image/jpeg" } as unknown as Blob);
    const response = await fetch(`${validation.normalizedBaseUrl}/v1/auth/profile/media`, { method: "POST", headers: await authHeaders(settings.token), body: formData });
    if (!response.ok) throw new Error(`تعذر رفع صورة ${kind}: ${response.status}`);
    return response.json() as Promise<{ kind: string; url: string }>;
  },
  async deleteProfileMedia(kind: "avatar" | "background") {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (!validation.valid) throw new Error(validation.message);
    const response = await fetch(`${validation.normalizedBaseUrl}/v1/auth/profile/media?kind=${kind}`, { method: "DELETE", headers: await authHeaders(settings.token) });
    if (!response.ok) throw new Error(`تعذر حذف صورة ${kind}: ${response.status}`);
    return response.json() as Promise<{ success: boolean; kind: string }>;
  },
  async registerPushToken(token: string, platform: string) {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (!validation.valid) throw new Error(validation.message);
    const response = await fetch(`${validation.normalizedBaseUrl}/v1/auth/push-token`, { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders(settings.token)) }, body: JSON.stringify({ token, platform }) });
    if (!response.ok) throw new Error(`تعذر تسجيل إشعارات الجهاز: ${response.status}`);
    return response.json() as Promise<{ success: boolean }>;
  },
  async getIceServers() {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (!validation.valid) throw new Error(validation.message);
    const response = await fetch(buildIceServersUrl({ ...settings, baseUrl: validation.normalizedBaseUrl }), { headers: await authHeaders(settings.token) });
    if (!response.ok) throw new Error(`تعذر جلب خوادم الاتصال: ${response.status}`);
    return response.json() as Promise<{ iceServers: IceServer[] }>;
  },
  async openRealtime(onEvent: (event: RealtimeEvent) => void) {
    const settings = await serverConfigStore.load();
    const validation = validateServerSettings(settings);
    if (!validation.valid) throw new Error(validation.message);
    return new Promise<WebSocket>((resolve, reject) => {
      const socket = new WebSocket(buildRealtimeUrl({ ...settings, baseUrl: validation.normalizedBaseUrl }));
      const timeout = setTimeout(() => { socket.close(); reject(new Error("انتهت مهلة قناة التحديثات.")); }, 7000);
      socket.onopen = () => { clearTimeout(timeout); resolve(socket); };
      socket.onerror = () => { clearTimeout(timeout); reject(new Error("تعذر فتح قناة التحديثات.")); };
      socket.onmessage = (message) => { try { onEvent(JSON.parse(String(message.data)) as RealtimeEvent); } catch { /* ignore invalid frames */ } };
    });
  },
};
