import { File } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { safeAttachmentFilename } from "@/lib/attachment-filename";
import { getAttachmentDirectory } from "@/lib/media-cache";
import type { MediaAttachment } from "@/lib/messenger-models";

export type AttachmentSaveResult = { ok: boolean; message: string };

async function getLocalCopy(attachment: MediaAttachment) {
  if (!attachment.uri) return null;
  const directory = getAttachmentDirectory(attachment.kind, "received");
  const destination = new File(directory, safeAttachmentFilename(attachment.name));
  if (/^https?:\/\//.test(attachment.uri)) return File.downloadFileAsync(attachment.uri, destination, { idempotent: true });
  const source = new File(attachment.uri);
  if (!source.exists) return null;
  source.copy(destination);
  return destination;
}

export async function saveIncomingAttachment(attachment: MediaAttachment): Promise<AttachmentSaveResult> {
  if (Platform.OS === "web") return { ok: false, message: "حفظ الملفات يُختبر في نسخة Android. هذه المعاينة لا تملك مجلد تنزيلات للجهاز." };
  try {
    const file = await getLocalCopy(attachment);
    if (!file?.exists) return { ok: false, message: "لا يحتوي هذا المرفق التجريبي على ملف قابل للحفظ بعد." };
    if (attachment.kind === "image" || attachment.kind === "video") {
      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (!permission.granted) return { ok: false, message: "يلزم السماح بحفظ الوسائط لإضافتها إلى معرض الجهاز." };
      await MediaLibrary.saveToLibraryAsync(file.uri);
      return { ok: true, message: "تم حفظ الوسيط في معرض الجهاز." };
    }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { dialogTitle: `حفظ أو مشاركة ${attachment.name}`, mimeType: attachment.mimeType });
      return { ok: true, message: "تم تجهيز الملف للحفظ أو المشاركة من قائمة النظام." };
    }
    return { ok: true, message: "تم حفظ الملف داخل مساحة التطبيق." };
  } catch {
    return { ok: false, message: "تعذر حفظ هذا المرفق. حاول مرة أخرى." };
  }
}
