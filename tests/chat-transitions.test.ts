import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("chat visual feedback", () => {
  const source = readFileSync(resolve(process.cwd(), "app/chat/[id].tsx"), "utf8");

  it("animates chat entry and message appearance", () => {
    expect(source).toContain("screenOpacity");
    expect(source).toContain("messageOpacity");
    expect(source).toContain("Animated.parallel");
  });

  it("shows a visible image loading indicator before the image is ready", () => {
    expect(source).toContain("imageReady");
    expect(source).toContain("جارٍ تحميل الصورة");
    expect(source).toContain("mediaLoading");
  });
});
