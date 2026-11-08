import type { MediaAttachment, MediaKind } from "@/lib/messenger-models";

export function inferMediaKind(mimeType: string | null | undefined, name = ""): MediaKind {
  const normalizedMime = (mimeType ?? "").toLowerCase();
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  if (normalizedMime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(extension)) return "image";
  if (normalizedMime.startsWith("video/") || ["mp4", "mov", "mkv", "webm"].includes(extension)) return "video";
  if (normalizedMime.startsWith("audio/") || ["mp3", "m4a", "wav", "ogg", "aac"].includes(extension)) return "audio";
  return "file";
}

export function formatFileSize(size?: number) {
  if (!size || size <= 0) return "حجم غير معروف";
  if (size < 1024) return `${size} بايت`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} كيلوبايت`;
  return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} ميجابايت`;
}

export function formatTransferProgress(progress?: number) {
  const normalized = Math.max(0, Math.min(100, Math.round(progress ?? 0)));
  return `${normalized}%`;
}

export function attachmentSummary(attachments: MediaAttachment[]) {
  const first = attachments[0];
  if (!first) return "مرفق";
  const labels: Record<MediaKind, string> = { image: "صورة", video: "فيديو", audio: "تسجيل صوتي", file: "ملف" };
  return attachments.length === 1 ? labels[first.kind] : `${attachments.length} مرفقات`;
}

export function createMediaAttachment(input: Omit<MediaAttachment, "id" | "kind" | "transferState">): MediaAttachment {
  return {
    ...input,
    id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: inferMediaKind(input.mimeType, input.name),
    transferState: "preparing",
  };
}
