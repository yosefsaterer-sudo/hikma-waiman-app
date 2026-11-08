import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const CHANNEL_ID = "messages";
const CHANNEL_ID_SILENT = "messages-silent";

const PREF_ENABLED = "messenger.notifications.enabled";
const PREF_SOUND = "messenger.notifications.sound";
const PREF_VIBRATION = "messenger.notifications.vibration";
const PREF_PREVIEW = "messenger.notifications.preview";
const PREF_GROUPS = "messenger.notifications.groups";

export type NotificationTestResult = "scheduled" | "preview" | "denied" | "disabled";

export type NotificationSettings = {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  preview: boolean;
  groups: boolean;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  sound: true,
  vibration: true,
  preview: true,
  groups: true,
};

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function configureNotificationChannel() {
  if (Platform.OS !== "android") return;

  const settings = await loadNotificationSettings();

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "رسائل حكمة وإيمان",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: settings.vibration ? [0, 180, 100, 180] : [0],
    lightColor: "#0B5FFF",
    sound: settings.sound ? "default" : null,
    enableVibrate: settings.vibration,
  });

  await Notifications.setNotificationChannelAsync(CHANNEL_ID_SILENT, {
    name: "رسائل صامتة",
    importance: Notifications.AndroidImportance.LOW,
    vibrationPattern: [0],
    sound: null,
    enableVibrate: false,
  });
}

// ==========================================
// إعدادات الإشعارات
// ==========================================

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  const [enabled, sound, vibration, preview, groups] = await Promise.all([
    AsyncStorage.getItem(PREF_ENABLED),
    AsyncStorage.getItem(PREF_SOUND),
    AsyncStorage.getItem(PREF_VIBRATION),
    AsyncStorage.getItem(PREF_PREVIEW),
    AsyncStorage.getItem(PREF_GROUPS),
  ]);

  return {
    enabled: enabled === "true",
    sound: sound === null ? true : sound === "true",
    vibration: vibration === null ? true : vibration === "true",
    preview: preview === null ? true : preview === "true",
    groups: groups === null ? true : groups === "true",
  };
}

export async function saveNotificationSettings(settings: NotificationSettings) {
  await Promise.all([
    AsyncStorage.setItem(PREF_ENABLED, String(settings.enabled)),
    AsyncStorage.setItem(PREF_SOUND, String(settings.sound)),
    AsyncStorage.setItem(PREF_VIBRATION, String(settings.vibration)),
    AsyncStorage.setItem(PREF_PREVIEW, String(settings.preview)),
    AsyncStorage.setItem(PREF_GROUPS, String(settings.groups)),
  ]);
}

export async function loadNotificationPreference() {
  const settings = await loadNotificationSettings();
  return settings.enabled;
}

export async function saveNotificationPreference(enabled: boolean) {
  const settings = await loadNotificationSettings();
  await saveNotificationSettings({ ...settings, enabled });
}

// ==========================================
// تفعيل الإشعارات
// ==========================================

export async function enableLocalNotifications() {
  if (Platform.OS === "web") {
    await saveNotificationPreference(true);
    return "preview" as const;
  }
  await configureNotificationChannel();
  const existing = await Notifications.getPermissionsAsync();
  const result = existing.status === "granted" ? existing : await Notifications.requestPermissionsAsync();
  if (result.status !== "granted") return "denied" as const;
  await saveNotificationPreference(true);
  return "scheduled" as const;
}

// ==========================================
// إرسال إشعار تجريبي
// ==========================================

export async function sendDemoMessageNotification() {
  const settings = await loadNotificationSettings();
  if (!settings.enabled) return "disabled" as const;
  if (Platform.OS === "web") return "preview" as const;

  const channelId = settings.sound || settings.vibration ? CHANNEL_ID : CHANNEL_ID_SILENT;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "رسالة تجريبية",
      body: settings.preview ? "أرسلت ليلى صورة جديدة في محادثة التجربة." : "لديك رسالة جديدة.",
      data: { route: "/chat/layla" },
      sound: settings.sound ? "default" : undefined,
    },
    trigger: {
      channelId,
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      repeats: false,
    },
  });
  return "scheduled" as const;
}

// ==========================================
// إرسال إشعار رسالة جديدة (للاستخدام المستقبلي)
// ==========================================

export async function sendMessageNotification(params: {
  conversationId: string;
  senderName: string;
  messageText: string;
  isGroup: boolean;
}) {
  const settings = await loadNotificationSettings();
  if (!settings.enabled) return "disabled" as const;
  if (Platform.OS === "web") return "preview" as const;

  // تجاهل إشعارات المجموعات إذا كانت معطلة
  if (params.isGroup && !settings.groups) return "disabled" as const;

  const channelId = settings.sound || settings.vibration ? CHANNEL_ID : CHANNEL_ID_SILENT;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: params.senderName,
      body: settings.preview ? params.messageText : "لديك رسالة جديدة.",
      data: { route: `/chat/${params.conversationId}` },
      sound: settings.sound ? "default" : undefined,
    },
    trigger: {
      channelId,
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      repeats: false,
    },
  });
  return "scheduled" as const;
}
