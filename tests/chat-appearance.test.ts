import { describe, expect, it } from "vitest";

import { CHAT_BACKGROUNDS, THEME_OPTIONS } from "../lib/chat-appearance";

describe("خيارات مظهر مراسل آمن", () => {
  it("يوفر فاتحًا وداكنًا وحسب النظام", () => {
    expect(THEME_OPTIONS.map((option) => option.value)).toEqual(["system", "light", "dark"]);
  });

  it("يعرف خلفيات محادثة للنسقين", () => {
    expect(CHAT_BACKGROUNDS.mist.light).toMatch(/^#/);
    expect(CHAT_BACKGROUNDS.night.dark).toMatch(/^#/);
  });
});
