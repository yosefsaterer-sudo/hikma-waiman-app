import { describe, expect, it } from "vitest";

import { canRequestMicrophoneOnWeb } from "../lib/recording-support";

describe("canRequestMicrophoneOnWeb", () => {
  it("يسمح بالتسجيل الأصلي دون الاعتماد على واجهة المتصفح", () => {
    expect(canRequestMicrophoneOnWeb("android", false, false)).toBe(true);
  });

  it("يتطلب MediaDevices وgetUserMedia في معاينة الويب", () => {
    expect(canRequestMicrophoneOnWeb("web", false, false)).toBe(false);
    expect(canRequestMicrophoneOnWeb("web", true, false)).toBe(false);
    expect(canRequestMicrophoneOnWeb("web", true, true)).toBe(true);
  });
});
