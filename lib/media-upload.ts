import type { MediaAttachment } from "@/lib/messenger-models";
import { serverConfigStore } from "@/lib/server-config";
import { buildMediaUploadUrl, validateServerSettings } from "@/lib/server-validation";

export type UploadedMedia = { url: string; mediaId?: string };

/**
 * يرفع ملفًا في حقل multipart اسمه file. يتوقع من الخادم استجابة JSON تحتوي url وmediaId اختياريًا.
 * يُستدعى هذا عند وصل التطبيق بواجهة الرسائل الفعلية؛ أما النسخة الحالية فتعرض حالة النقل محليًا.
 */
export async function uploadMediaToPrivateServer(attachment: MediaAttachment): Promise<UploadedMedia> {
  const settings = await serverConfigStore.load();
  const validation = validateServerSettings(settings);
  if (!validation.valid) throw new Error(validation.message);

  const formData = new FormData();
  const nativeFile = { uri: attachment.uri, name: attachment.name, type: attachment.mimeType };
  formData.append("file", nativeFile as unknown as Blob);
  const response = await fetch(buildMediaUploadUrl({ ...settings, baseUrl: validation.normalizedBaseUrl }), {
    method: "POST",
    body: formData,
    headers: settings.token ? { Authorization: `Bearer ${settings.token}` } : undefined,
  });
  if (!response.ok) throw new Error(`فشل رفع الملف: ${response.status}`);
  const payload = (await response.json()) as { url?: string; mediaId?: string };
  if (!payload.url) throw new Error("استجابة خادم الوسائط لا تحتوي رابط الملف.");
  return { url: payload.url, mediaId: payload.mediaId };
}
