export function safeAttachmentFilename(name: string) {
  const cleaned = name.trim().replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-");
  return cleaned || "مرفق";
}
