import { describe, expect, it } from "vitest";

import { buildThemeVariables } from "../lib/theme-variables";

describe("متغيرات السمة الأصلية", () => {
  it("يعرّف الخلفية وباقي الرموز كمتغيرات CSS صالحة لـ NativeWind", () => {
    const variables = buildThemeVariables({
      primary: "#0B5FFF",
      background: "#F7F9FE",
      surface: "#FFFFFF",
      foreground: "#10233F",
      muted: "#65738A",
      border: "#E0E7F3",
      success: "#138A5B",
      warning: "#B7791F",
      error: "#C83D4B",
    });

    expect(variables["--color-background"]).toBeTruthy();
    expect(variables["--color-foreground"]).toBeTruthy();
    expect(Object.keys(variables).every((name) => name.startsWith("--color-"))).toBe(true);
  });
});
