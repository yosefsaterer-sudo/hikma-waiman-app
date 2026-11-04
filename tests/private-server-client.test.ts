import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildAccountsUrl, buildConversationMessagesUrl, buildDirectConversationUrl, buildIceServersUrl, buildRealtimeUrl, buildSendMessageUrl } from "../lib/server-validation";
import { normalizeConversation, parseItems } from "../lib/private-server-response";

describe("عميل الخادم الخاص", () => {
  const settings = { baseUrl: "https://chat.example.com/", conversationsPath: "/v1/conversations", realtimePath: "/v1/realtime", icePath: "/v1/calls/ice", token: "test-token" };
  it("ينشئ مسارات الرسائل وفق معرف المحادثة", () => {
    expect(buildConversationMessagesUrl(settings, "team a", "next")).toBe("https://chat.example.com/v1/conversations/team%20a/messages?cursor=next");
    expect(buildSendMessageUrl(settings, "team a")).toBe("https://chat.example.com/v1/conversations/team%20a/messages");
  });
  it("ينشئ رابط ICE ورابط التحديثات WSS مع رمز الوصول", () => {
    expect(buildIceServersUrl(settings)).toBe("https://chat.example.com/v1/calls/ice");
    expect(buildRealtimeUrl(settings)).toBe("wss://chat.example.com/v1/realtime?access_token=test-token");
  });
  it("ينشئ مسارات الحسابات وبدء محادثة خاصة", () => {
    expect(buildAccountsUrl(settings)).toBe("https://chat.example.com/v1/accounts");
    expect(buildDirectConversationUrl(settings)).toBe("https://chat.example.com/v1/conversations/direct");
  });
  it("يحوّل استجابة الحسابات المغلفة داخل items إلى قائمة قابلة للفلترة", () => {
    expect(parseItems<{ id: string; username: string }>({ items: [{ id: "2", username: "layla1" }] })).toEqual([{ id: "2", username: "layla1" }]);
    expect(parseItems<{ id: string; username: string }>([])).toEqual([]);
  });
  it("يحوّل otherUsername الذي يعيده الخادم إلى اسم محادثة صالح", () => {
    expect(normalizeConversation({ id: "conv-1", kind: "direct", otherUsername: "layla1" })).toMatchObject({ id: "conv-1", name: "layla1", initials: "la", kind: "direct" });
  });
  it("لا يفرض عنوان خادم افتراضيًا", () => {
    const authSource = readFileSync(resolve(process.cwd(), "lib/messenger-auth.ts"), "utf8");
    expect(authSource).toContain('DEFAULT_MESSENGER_SERVER = ""');
    expect(authSource).not.toContain("ngrok-free");
  });
});
