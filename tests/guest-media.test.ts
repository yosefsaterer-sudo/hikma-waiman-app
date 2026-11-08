import { describe, expect, it } from "vitest";

import { formatTransferProgress } from "../lib/media-utils";
import { buildMediaUploadUrl } from "../lib/server-validation";

describe("تجربة الزائر ونقل الوسائط", () => {
  it("يقيد نسبة التقدم ضمن النطاق القابل للعرض", () => {
    expect(formatTransferProgress(-5)).toBe("0%");
    expect(formatTransferProgress(63.7)).toBe("64%");
    expect(formatTransferProgress(125)).toBe("100%");
  });

  it("يستخدم مسار رفع الوسائط القابل للضبط", () => {
    expect(buildMediaUploadUrl({ baseUrl: "https://chat.example.com/", mediaPath: "/api/media" })).toBe("https://chat.example.com/api/media");
  });
});
