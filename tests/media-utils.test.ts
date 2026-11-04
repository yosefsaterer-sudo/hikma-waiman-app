import { describe, expect, it } from "vitest";

import { attachmentSummary, formatFileSize, inferMediaKind } from "../lib/media-utils";

describe("وسائط المحادثة", () => {
  it("يتعرف على الصور والفيديو والصوت والملفات", () => {
    expect(inferMediaKind("image/jpeg", "photo.jpg")).toBe("image");
    expect(inferMediaKind("video/mp4", "clip.mp4")).toBe("video");
    expect(inferMediaKind("audio/mpeg", "note.mp3")).toBe("audio");
    expect(inferMediaKind("application/pdf", "report.pdf")).toBe("file");
  });

  it("يعرض حجم الملف بصيغة عربية موجزة", () => {
    expect(formatFileSize(1536)).toBe("2 كيلوبايت");
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5 ميجابايت");
  });

  it("يلخص مجموعة المرفقات لصالح قائمة المحادثات", () => {
    expect(attachmentSummary([{ id: "1", kind: "image", uri: "file://photo.jpg", name: "photo.jpg", mimeType: "image/jpeg", transferState: "sent" }])).toBe("صورة");
  });
});
