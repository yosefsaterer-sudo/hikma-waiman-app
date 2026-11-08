import AsyncStorage from "@react-native-async-storage/async-storage";

// ==========================================
// أنواع البيانات
// ==========================================

export type MediaKindSettings = {
  image: boolean;
  video: boolean;
  audio: boolean;
  document: boolean;
};

export type NetworkType = "wifi" | "mobile" | "roaming";

export type DownloadSettings = {
  autoDownload: Record<NetworkType, MediaKindSettings>;
  downloadQuality: "high" | "medium" | "low";
  autoDownloadQuality: "high" | "medium" | "low";
};

// ==========================================
// القيم الافتراضية (مثل واتساب)
// ==========================================

export const DEFAULT_DOWNLOAD_SETTINGS: DownloadSettings = {
  autoDownload: {
    wifi: { image: true, video: true, audio: true, document: true },
    mobile: { image: true, video: false, audio: true, document: false },
    roaming: { image: false, video: false, audio: false, document: false },
  },
  downloadQuality: "high",
  autoDownloadQuality: "medium",
};

const STORAGE_KEY = "messenger.download.settings";

// ==========================================
// دوال التحميل والحفظ
// ==========================================

export async function loadDownloadSettings(): Promise<DownloadSettings> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_DOWNLOAD_SETTINGS;

  try {
    const parsed = JSON.parse(stored) as Partial<DownloadSettings>;
    return {
      autoDownload: {
        wifi: { ...DEFAULT_DOWNLOAD_SETTINGS.autoDownload.wifi, ...parsed.autoDownload?.wifi },
        mobile: { ...DEFAULT_DOWNLOAD_SETTINGS.autoDownload.mobile, ...parsed.autoDownload?.mobile },
        roaming: { ...DEFAULT_DOWNLOAD_SETTINGS.autoDownload.roaming, ...parsed.autoDownload?.roaming },
      },
      downloadQuality: parsed.downloadQuality || "high",
      autoDownloadQuality: parsed.autoDownloadQuality || "medium",
    };
  } catch {
    return DEFAULT_DOWNLOAD_SETTINGS;
  }
}

export async function saveDownloadSettings(settings: DownloadSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// ==========================================
// دوال مساعدة
// ==========================================

/**
 * التحقق مما إذا كان يجب التنزيل التلقائي
 */
export async function shouldAutoDownload(
  kind: "image" | "video" | "audio" | "document",
  networkType: NetworkType
): Promise<boolean> {
  const settings = await loadDownloadSettings();
  return settings.autoDownload[networkType][kind];
}

/**
 * الحصول على جودة التنزيل
 */
export async function getDownloadQuality(): Promise<"high" | "medium" | "low"> {
  const settings = await loadDownloadSettings();
  return settings.downloadQuality;
}

/**
 * الحصول على جودة التنزيل التلقائي
 */
export async function getAutoDownloadQuality(): Promise<"high" | "medium" | "low"> {
  const settings = await loadDownloadSettings();
  return settings.autoDownloadQuality;
}

/**
 * إعادة تعيين الإعدادات إلى الوضع الافتراضي
 */
export async function resetDownloadSettings(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
