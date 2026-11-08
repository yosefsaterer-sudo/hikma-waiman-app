import { describe, expect, it } from "vitest";

import { safeAttachmentFilename } from "../lib/attachment-filename";

describe("safeAttachmentFilename", () => {
  it("يحوّل اسم المرفق إلى اسم آمن للحفظ", () => {
    expect(safeAttachmentFilename(" تقرير: اليوم/النهائي.pdf ")).toBe("تقرير-اليوم-النهائي.pdf");
  });

  it("يضع اسمًا بديلًا عند غياب الاسم", () => {
    expect(safeAttachmentFilename("   ")).toBe("مرفق");
  });
});
