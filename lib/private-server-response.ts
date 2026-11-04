import type { ServerAccount, ServerConversation } from "@/lib/private-server-client";

export type ListResponse<T> = { items?: T[] };

export function parseItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && Array.isArray((payload as ListResponse<unknown>).items)) {
    return (payload as ListResponse<T>).items || [];
  }
  return [];
}

export function normalizeConversation(payload: Partial<ServerConversation> & { id: string; otherUsername?: string }): ServerConversation {
  const name = payload.name || payload.otherUsername || "محادثة خاصة";
  return {
    id: payload.id,
    name,
    otherUsername: payload.otherUsername,
    initials: payload.initials || name.slice(0, 2),
    color: payload.color || "#0B5FFF",
    kind: payload.kind || "direct",
    participants: payload.participants || 2,
    unread: payload.unread || 0,
    verified: payload.verified ?? true,
    lastMessage: payload.lastMessage || "",
    time: payload.time || "",
  };
}
