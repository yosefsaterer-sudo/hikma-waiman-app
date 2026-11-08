export type ServerSettings = {
  baseUrl: string;
  apiPath: string;
  mediaPath?: string;
  conversationsPath?: string;
  realtimePath?: string;
  icePath?: string;
  token?: string;
};

export type ValidationResult = { valid: true; normalizedBaseUrl: string } | { valid: false; message: string };

export function validateServerSettings(settings: ServerSettings): ValidationResult {
  const baseUrl = settings.baseUrl.trim().replace(/\/$/, "");
  if (!baseUrl) return { valid: false, message: "أدخل عنوان الخادم أولاً." };
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "10.0.2.2") {
      return { valid: false, message: "استخدم HTTPS، أو localhost أثناء التطوير." };
    }
    return { valid: true, normalizedBaseUrl: baseUrl };
  } catch {
    return { valid: false, message: "عنوان الخادم غير صالح." };
  }
}

export function buildHealthUrl(settings: Pick<ServerSettings, "baseUrl" | "apiPath">) {
  const baseUrl = settings.baseUrl.trim().replace(/\/$/, "");
  const path = (settings.apiPath || "/health").trim().replace(/^\/?/, "/");
  return `${baseUrl}${path}`;
}

export function buildMediaUploadUrl(settings: Pick<ServerSettings, "baseUrl" | "mediaPath">) {
  const baseUrl = settings.baseUrl.trim().replace(/\/$/, "");
  const path = (settings.mediaPath || "/v1/media").trim().replace(/^\/?/, "/");
  return `${baseUrl}${path}`;
}

function buildPath(baseUrl: string, path: string) {
  return `${baseUrl.trim().replace(/\/$/, "")}${path.trim().replace(/^\/?/, "/")}`;
}

export function buildConversationsUrl(settings: Pick<ServerSettings, "baseUrl" | "conversationsPath">) {
  return buildPath(settings.baseUrl, settings.conversationsPath || "/v1/conversations");
}

export function buildAccountsUrl(settings: Pick<ServerSettings, "baseUrl">) {
  return buildPath(settings.baseUrl, "/v1/accounts");
}

export function buildDirectConversationUrl(settings: Pick<ServerSettings, "baseUrl" | "conversationsPath">) {
  return `${buildConversationsUrl(settings)}/direct`;
}

export function buildConversationMessagesUrl(settings: Pick<ServerSettings, "baseUrl" | "conversationsPath">, conversationId: string, cursor?: string) {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return `${buildConversationsUrl(settings)}/${encodeURIComponent(conversationId)}/messages${query}`;
}

export function buildSendMessageUrl(settings: Pick<ServerSettings, "baseUrl" | "conversationsPath">, conversationId: string) {
  return `${buildConversationsUrl(settings)}/${encodeURIComponent(conversationId)}/messages`;
}

export function buildConversationActionUrl(settings: Pick<ServerSettings, "baseUrl" | "conversationsPath">, conversationId: string) {
  return `${buildConversationsUrl(settings)}/${encodeURIComponent(conversationId)}`;
}

export function buildMessageActionUrl(settings: Pick<ServerSettings, "baseUrl">, messageId: string, action?: "read") {
  const suffix = action ? `/${action}` : "";
  return `${buildPath(settings.baseUrl, `/v1/messages/${encodeURIComponent(messageId)}${suffix}`)}`;
}

export function buildIceServersUrl(settings: Pick<ServerSettings, "baseUrl" | "icePath">) {
  return buildPath(settings.baseUrl, settings.icePath || "/v1/calls/ice");
}

export function buildRealtimeUrl(settings: Pick<ServerSettings, "baseUrl" | "realtimePath" | "token">) {
  const restUrl = new URL(buildPath(settings.baseUrl, settings.realtimePath || "/v1/realtime"));
  restUrl.protocol = restUrl.protocol === "https:" ? "wss:" : "ws:";
  if (settings.token) restUrl.searchParams.set("access_token", settings.token);
  return restUrl.toString();
}
