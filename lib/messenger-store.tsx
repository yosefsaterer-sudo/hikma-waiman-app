import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";

import { attachmentSummary } from "@/lib/media-utils";
import { messengerAuth } from "@/lib/messenger-auth";
import { privateServerClient, type ServerMessage } from "@/lib/private-server-client";
import { uploadMediaToPrivateServer } from "@/lib/media-upload";
import { copyAttachmentToDirection } from "@/lib/media-cache";
import { shouldAutoDownload, type NetworkType } from "@/lib/download-settings";
import { deleteMediaLocally, downloadAndSaveMedia, getDownloadedMedia } from "@/lib/storage-manager";
import { serverConfigStore } from "@/lib/server-config";
import type { ChatMessage, Conversation, MediaAttachment } from "@/lib/messenger-models";

function formatServerTime(value: string) {
  return new Intl.DateTimeFormat("ar", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

async function currentNetworkType(): Promise<NetworkType> {
  try {
    const state = await Network.getNetworkStateAsync();
    if (!state.isConnected) return "roaming";
    if (state.type === Network.NetworkStateType.WIFI) return "wifi";
    if (state.type === Network.NetworkStateType.CELLULAR) return "mobile";
  } catch {
    // Treat an unknown connection conservatively as mobile data.
  }
  return "mobile";
}

async function mapServerMessage(message: ServerMessage, accountId: string, serverBaseUrl: string): Promise<ChatMessage> {
  const networkType = await currentNetworkType();
  const attachments = await Promise.all((message.media ?? []).map(async (media) => {
    const kind: MediaAttachment["kind"] = media.mimeType.startsWith("image/") ? "image" : media.mimeType.startsWith("video/") ? "video" : media.mimeType.startsWith("audio/") ? "audio" : "file";
    const remoteUrl = media.url.startsWith("/") ? `${serverBaseUrl.replace(/\/$/, "")}${media.url}` : media.url;
    const name = media.name || "مرفق";
    const settingsKind = kind === "file" ? "document" : kind;
    const cached = await getDownloadedMedia(media.mediaId);
    if (cached) {
      return { id: media.mediaId, kind, uri: cached.localUri, name, mimeType: media.mimeType, size: media.size, transferState: "received" as const };
    }
    const shouldDownload = await shouldAutoDownload(settingsKind, networkType);
    if (shouldDownload) {
      try {
        const saved = await downloadAndSaveMedia(remoteUrl, media.mediaId, name, media.mimeType, media.size || 0);
        return { id: media.mediaId, kind, uri: saved.localUri, name, mimeType: media.mimeType, size: media.size, transferState: "received" as const };
      } catch {
        return { id: media.mediaId, kind, uri: remoteUrl, name, mimeType: media.mimeType, size: media.size, transferState: "failed" as const };
      }
    }
    return { id: media.mediaId, kind, uri: remoteUrl, name, mimeType: media.mimeType, size: media.size, transferState: "received" as const };
  }));
  return {
    id: message.id,
    text: message.text,
    time: formatServerTime(message.createdAt),
    outgoing: message.senderId === accountId,
    status: message.senderId === accountId && message.readBy?.some((readerId) => readerId !== accountId) ? "read" : "delivered",
    attachments: attachments.length ? attachments : undefined,
  };
}

type MessengerContextValue = {
  conversationList: Conversation[];
  messagesByConversation: Record<string, ChatMessage[]>;
  sendMessage: (conversationId: string, text: string, replyTo?: ChatMessage["replyTo"]) => void;
  sendAttachments: (conversationId: string, attachments: MediaAttachment[], text?: string) => void;
  receiveAttachments: (conversationId: string, attachments: MediaAttachment[], text?: string) => void;
  retryAttachment: (conversationId: string, attachmentId: string) => void;
  clearUnread: (conversationId: string) => void;
  startDirectConversation: (username: string) => Promise<Conversation | null>;
  createGroup: (name: string, memberIds: string[]) => Conversation | null;
  deleteMessage: (conversationId: string, messageId: string, forEveryone?: boolean) => Promise<void>;
  forwardMessage: (conversationId: string, message: ChatMessage) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
};

const MessengerContext = createContext<MessengerContextValue | null>(null);

export function MessengerProvider({ children }: PropsWithChildren) {
  const [conversationList, setConversationList] = useState<Conversation[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
  const [serverMode, setServerMode] = useState(false);

  const refreshFromServer = useCallback(async () => {
    try {
      const settings = await serverConfigStore.load();
      if (!settings.baseUrl) {
        setServerMode(false);
        setConversationList([]);
        setMessagesByConversation({});
        return;
      }
      const serverConversations = (await privateServerClient.listConversations()) as Array<Partial<Conversation> & { id: string; name: string; lastMessage?: string; time?: string }>;
      const serverConversationList = serverConversations.map((item) => ({
        id: item.id,
        name: item.name,
        initials: item.initials || item.name.slice(0, 2),
        color: item.color || "#0B5FFF",
        avatarUrl: item.avatarUrl || undefined,
        kind: item.kind || "group",
        lastMessage: item.lastMessage || "",
        time: item.time || "",
        unread: item.unread || 0,
        verified: item.verified || false,
        participants: item.participants || 2,
      })) as Conversation[];
      const account = await messengerAuth.loadSession();
      const accountId = account?.id || "";
      const serverMessages = await Promise.all(serverConversationList.map(async (conversation) => {
        const response = await privateServerClient.listMessages(conversation.id);
        const mapped = await Promise.all(response.items.map((message) => mapServerMessage(message, accountId, settings.baseUrl)));
        await Promise.all(response.items.filter((message) => message.senderId !== accountId).map((message) => privateServerClient.markMessageRead(message.id).catch(() => undefined)));
        return [conversation.id, mapped] as const;
      }));
      setServerMode(true);
      setConversationList(serverConversationList);
      setMessagesByConversation(Object.fromEntries(serverMessages));
    } catch {
      setServerMode(false);
      setConversationList([]);
      setMessagesByConversation({});
    }
  }, []);

  useEffect(() => {
    void refreshFromServer();
    const unsubscribe = serverConfigStore.subscribe(() => { void refreshFromServer(); });
    const interval = setInterval(() => { void refreshFromServer(); }, 4000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refreshFromServer]);

  const getTime = useCallback(() => new Intl.DateTimeFormat("ar", { hour: "2-digit", minute: "2-digit" }).format(new Date()), []);
  const clearUnread = useCallback((conversationId: string) => {
    setConversationList((current) => current.map((conversation) => conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation));
  }, []);
  const sendMessage = useCallback((conversationId: string, text: string, replyTo?: ChatMessage["replyTo"]) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const time = getTime();
    const localMessage: ChatMessage = { id: `${conversationId}-${Date.now()}`, text: trimmed, time, outgoing: true, status: "sent", replyTo };
    setMessagesByConversation((current) => ({ ...current, [conversationId]: [...(current[conversationId] ?? []), localMessage] }));
    setConversationList((current) => current.map((conversation) => conversation.id === conversationId ? { ...conversation, lastMessage: `أنت: ${trimmed}`, time, unread: 0 } : conversation));
    if (serverMode) {
      void privateServerClient.sendMessage(conversationId, trimmed).catch(() => undefined);
    }
  }, [getTime, serverMode]);
  const sendAttachments = useCallback((conversationId: string, attachments: MediaAttachment[], text = "") => {
    if (!attachments.length) return;
    const time = getTime();
    const messageId = `${conversationId}-media-${Date.now()}`;
    const outgoingAttachments = attachments.map((attachment) => ({ ...attachment, transferState: "sending" as const, progress: 12 }));
    const message: ChatMessage = { id: messageId, text: text.trim(), time, outgoing: true, status: "sent", attachments: outgoingAttachments };
    setMessagesByConversation((current) => ({ ...current, [conversationId]: [...(current[conversationId] ?? []), message] }));
    setConversationList((current) => current.map((conversation) => conversation.id === conversationId ? { ...conversation, lastMessage: text.trim() || `أنت: ${attachmentSummary(attachments)}`, time, unread: 0 } : conversation));
    if (serverMode) {
      void Promise.all(attachments.map((attachment) => Promise.resolve(copyAttachmentToDirection(attachment, "sent"))));
      void Promise.all(attachments.map((attachment) => uploadMediaToPrivateServer(attachment)))
        .then((uploaded) => privateServerClient.sendMessage(conversationId, text.trim(), uploaded.map((item) => item.mediaId).filter(Boolean) as string[]))
        .then(() => {
          setMessagesByConversation((current) => ({
            ...current,
            [conversationId]: (current[conversationId] ?? []).map((existing) => existing.id === messageId ? { ...existing, status: "read", attachments: existing.attachments?.map((attachment) => ({ ...attachment, transferState: "sent", progress: 100 })) } : existing),
          }));
        })
        .catch(() => {
          setMessagesByConversation((current) => ({
            ...current,
            [conversationId]: (current[conversationId] ?? []).map((existing) => existing.id === messageId ? { ...existing, attachments: existing.attachments?.map((attachment) => ({ ...attachment, transferState: "failed" })) } : existing),
          }));
        });
      return;
    }
    setTimeout(() => {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] ?? []).map((existing) => existing.id === messageId ? { ...existing, attachments: existing.attachments?.map((attachment) => ({ ...attachment, progress: 64 })) } : existing),
      }));
    }, 300);
    setTimeout(() => {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] ?? []).map((existing) => existing.id === messageId ? { ...existing, status: "read", attachments: existing.attachments?.map((attachment) => ({ ...attachment, transferState: "sent", progress: 100 })) } : existing),
      }));
    }, 700);
  }, [getTime, serverMode]);
  const receiveAttachments = useCallback((conversationId: string, attachments: MediaAttachment[], text = "") => {
    if (!attachments.length) return;
    const time = getTime();
    const message: ChatMessage = { id: `${conversationId}-received-${Date.now()}`, text, time, outgoing: false, status: "delivered", attachments: attachments.map((attachment) => ({ ...attachment, transferState: "received" })) };
    setMessagesByConversation((current) => ({ ...current, [conversationId]: [...(current[conversationId] ?? []), message] }));
  }, [getTime]);
  const retryAttachment = useCallback((conversationId: string, attachmentId: string) => {
    setMessagesByConversation((current) => ({ ...current, [conversationId]: (current[conversationId] ?? []).map((message) => ({ ...message, attachments: message.attachments?.map((attachment) => attachment.id === attachmentId ? { ...attachment, transferState: "sending", progress: 12 } : attachment) })) }));
    setTimeout(() => setMessagesByConversation((current) => ({ ...current, [conversationId]: (current[conversationId] ?? []).map((message) => ({ ...message, attachments: message.attachments?.map((attachment) => attachment.id === attachmentId ? { ...attachment, transferState: "sent", progress: 100 } : attachment) })) })), 650);
  }, []);
  const startDirectConversation = useCallback(async (username: string) => {
    const created = await privateServerClient.createDirectConversation(username);
    const conversation: Conversation = {
      id: created.id,
      name: created.name,
      initials: created.initials || created.name.slice(0, 2),
      color: created.color || "#0B5FFF",
      avatarUrl: created.avatarUrl || undefined,
      kind: "direct",
      lastMessage: created.lastMessage || "",
      time: created.time ? formatServerTime(created.time) : getTime(),
      unread: 0,
      verified: true,
      participants: 2,
    };
    setConversationList((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]);
    setMessagesByConversation((current) => ({ ...current, [conversation.id]: current[conversation.id] || [] }));
    return conversation;
  }, [getTime]);
  const createGroup = useCallback((name: string, memberIds: string[]) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const id = `group-${Date.now()}`;
    const group: Conversation = { id, name: trimmed, initials: trimmed.slice(0, 2), color: "#0B5FFF", kind: "group", lastMessage: "تم إنشاء المجموعة محليًا.", time: getTime(), unread: 0, verified: false, participants: memberIds.length + 1 };
    setConversationList((current) => [group, ...current]);
    setMessagesByConversation((current) => ({ ...current, [id]: [{ id: `${id}-welcome`, text: "تم إنشاء المجموعة. يمكنك بدء المحادثة الآن.", time: getTime(), outgoing: false, status: "delivered" }] }));
    return group;
  }, [getTime]);
  const deleteMessage = useCallback(async (conversationId: string, messageId: string, forEveryone = false) => {
    const target = messagesByConversation[conversationId]?.find((message) => message.id === messageId);
    if (!target) return;
    if (forEveryone && serverMode && target.outgoing) await privateServerClient.deleteMessage(messageId);
    await Promise.all((target.attachments ?? []).map((attachment) => deleteMediaLocally(attachment.id)));
    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: (current[conversationId] ?? []).map((message) => message.id === messageId ? { ...message, text: "تم حذف هذه الرسالة", attachments: undefined, deleted: true } : message),
    }));
  }, [messagesByConversation, serverMode]);
  const forwardMessage = useCallback(async (conversationId: string, message: ChatMessage) => {
    if (!serverMode) { sendMessage(conversationId, message.text || "مرفق معاد توجيهه"); return; }
    if (!message.attachments?.length) { sendMessage(conversationId, message.text); return; }
    const uploaded = await Promise.all(message.attachments.map((attachment) => uploadMediaToPrivateServer(attachment)));
    await privateServerClient.sendMessage(conversationId, message.text || "مرفق معاد توجيهه", uploaded.map((item) => item.mediaId).filter(Boolean) as string[]);
    await refreshFromServer();
  }, [refreshFromServer, sendMessage, serverMode]);
  const markConversationRead = useCallback(async (conversationId: string) => {
    const messages = messagesByConversation[conversationId] ?? [];
    await Promise.all(messages.filter((message) => !message.outgoing).map((message) => privateServerClient.markMessageRead(message.id).catch(() => undefined)));
  }, [messagesByConversation]);
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (serverMode) await privateServerClient.deleteConversation(conversationId);
    setConversationList((current) => current.filter((conversation) => conversation.id !== conversationId));
    setMessagesByConversation((current) => { const next = { ...current }; delete next[conversationId]; return next; });
  }, [serverMode]);
  const value = useMemo<MessengerContextValue>(() => ({ conversationList, messagesByConversation, sendMessage, sendAttachments, receiveAttachments, retryAttachment, clearUnread, startDirectConversation, createGroup, deleteMessage, forwardMessage, markConversationRead, deleteConversation }), [clearUnread, conversationList, createGroup, deleteConversation, deleteMessage, forwardMessage, markConversationRead, messagesByConversation, receiveAttachments, retryAttachment, sendAttachments, sendMessage, startDirectConversation]);

  return <MessengerContext.Provider value={value}>{children}</MessengerContext.Provider>;
}

export function useMessenger() {
  const context = useContext(MessengerContext);
  if (!context) throw new Error("useMessenger must be used inside MessengerProvider");
  return context;
}
