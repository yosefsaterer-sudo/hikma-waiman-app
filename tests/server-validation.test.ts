import { describe, expect, it } from "vitest";

import { buildHealthUrl, validateServerSettings } from "../lib/server-validation";

describe("إعدادات الخادم الخاص", () => {
  it("يقبل عنوان HTTPS ويزيل الشرطة المائلة الختامية", () => {
    expect(validateServerSettings({ baseUrl: "https://chat.example.com/", apiPath: "/health" })).toEqual({
      valid: true,
      normalizedBaseUrl: "https://chat.example.com",
    });
  });

  it("يرفض HTTP غير المحلي لحماية بيانات الاتصال", () => {
    expect(validateServerSettings({ baseUrl: "http://chat.example.com", apiPath: "/health" })).toEqual({
      valid: false,
      message: "استخدم HTTPS، أو localhost أثناء التطوير.",
    });
  });

  it("يبني مسار فحص الحالة بصورة متسقة", () => {
    expect(buildHealthUrl({ baseUrl: "https://chat.example.com/", apiPath: "health" })).toBe("https://chat.example.com/health");
  });
});
