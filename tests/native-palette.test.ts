import { describe, expect, it } from "vitest";

import { getNativePalette } from "../lib/native-palette";

describe("لوحة الألوان الأصلية", () => {
  it("تعطي أسطحًا مختلفة للنسقين الفاتح والداكن", () => {
    expect(getNativePalette("light").background).not.toBe(getNativePalette("dark").background);
    expect(getNativePalette("dark").text).toBe("#F4F7FE");
  });
});
