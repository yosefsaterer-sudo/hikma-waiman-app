import { Directory, File, Paths } from "expo-file-system";

import { safeAttachmentFilename } from "@/lib/attachment-filename";
import type { MediaAttachment } from "@/lib/messenger-models";

const ROOT = new Directory(Paths.document, "HikmaWaiman");
const MEDIA = new Directory(ROOT, "media");
const IMAGES = new Directory(ROOT, "Media", "Images");
const VIDEOS = new Directory(ROOT, "Media", "Videos");
const AUDIO = new Directory(ROOT, "Media", "Audio");
const DOCUMENTS = new Directory(ROOT, "Media", "Documents");
const SENT = new Directory(ROOT, "Media", "Sent");
const RECEIVED = new Directory(ROOT, "Media", "Received");
const PROFILE = new Directory(ROOT, "profile");
const BACKGROUNDS = new Directory(ROOT, "backgrounds");

function ensureDirectories() {
  ROOT.create({ idempotent: true, intermediates: true });
  MEDIA.create({ idempotent: true, intermediates: true });
  IMAGES.create({ idempotent: true, intermediates: true });
  VIDEOS.create({ idempotent: true, intermediates: true });
  AUDIO.create({ idempotent: true, intermediates: true });
  DOCUMENTS.create({ idempotent: true, intermediates: true });
  SENT.create({ idempotent: true, intermediates: true });
  RECEIVED.create({ idempotent: true, intermediates: true });
  PROFILE.create({ idempotent: true, intermediates: true });
  BACKGROUNDS.create({ idempotent: true, intermediates: true });
}

function keyName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "media";
}

export function appStorageDirectories() {
  ensureDirectories();
  return { root: ROOT.uri, media: MEDIA.uri, images: IMAGES.uri, videos: VIDEOS.uri, audio: AUDIO.uri, documents: DOCUMENTS.uri, sent: SENT.uri, received: RECEIVED.uri, profile: PROFILE.uri, backgrounds: BACKGROUNDS.uri };
}

export function getAttachmentDirectory(kind: MediaAttachment["kind"], direction: "sent" | "received" = "received") {
  ensureDirectories();
  if (direction === "sent") return SENT;
  if (kind === "image") return IMAGES;
  if (kind === "video") return VIDEOS;
  if (kind === "audio") return AUDIO;
  return DOCUMENTS;
}

export async function getCachedMedia(attachment: Pick<MediaAttachment, "id" | "name" | "uri" | "kind">) {
  ensureDirectories();
  const destination = new File(getAttachmentDirectory(attachment.kind, "received"), `${keyName(attachment.id)}-${safeAttachmentFilename(attachment.name)}`);
  if (destination.exists) return destination.uri;
  if (!/^https?:\/\//i.test(attachment.uri)) return attachment.uri || null;
  try {
    const downloaded = await File.downloadFileAsync(attachment.uri, destination, { idempotent: true });
    return downloaded.uri;
  } catch {
    return null;
  }
}

export async function getCachedManagedMedia(
  attachment: Pick<MediaAttachment, "id" | "name" | "uri">,
  folder: "profile" | "backgrounds",
  filename: string,
) {
  ensureDirectories();
  const directory = folder === "profile" ? PROFILE : BACKGROUNDS;
  const destination = new File(directory, filename);
  if (destination.exists) return destination.uri;
  if (!/^https?:\/\//i.test(attachment.uri)) return attachment.uri || null;
  try {
    const downloaded = await File.downloadFileAsync(attachment.uri, destination, { idempotent: true });
    return downloaded.uri;
  } catch {
    return null;
  }
}

export function removeCachedMedia(id: string, name = "مرفق") {
  ensureDirectories();
  const prefix = `${keyName(id)}-`;
  for (const directory of [MEDIA, IMAGES, VIDEOS, AUDIO, DOCUMENTS, SENT, RECEIVED]) {
    for (const item of directory.list()) {
      if (item instanceof File && (item.name.startsWith(prefix) || item.name === safeAttachmentFilename(name))) {
        item.delete();
      }
    }
  }
}

export async function copyToManagedDirectory(uri: string, folder: "profile" | "backgrounds", filename: string) {
  ensureDirectories();
  const directory = folder === "profile" ? PROFILE : BACKGROUNDS;
  const destination = new File(directory, filename);
  const source = new File(uri);
  if (destination.exists) destination.delete();
  source.copy(destination);
  return destination.uri;
}

export function managedFile(folder: "profile" | "backgrounds", filename: string) {
  ensureDirectories();
  return new File(folder === "profile" ? PROFILE : BACKGROUNDS, filename);
}

export function copyAttachmentToDirection(attachment: Pick<MediaAttachment, "id" | "name" | "uri" | "kind">, direction: "sent" | "received") {
  ensureDirectories();
  if (!attachment.uri || /^https?:\/\//i.test(attachment.uri)) return null;
  const destination = new File(getAttachmentDirectory(attachment.kind, direction), `${keyName(attachment.id)}-${safeAttachmentFilename(attachment.name)}`);
  const source = new File(attachment.uri);
  if (!source.exists) return null;
  if (destination.exists) destination.delete();
  source.copy(destination);
  return destination.uri;
}
