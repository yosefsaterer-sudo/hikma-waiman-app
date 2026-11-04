import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("معالجة لوحة المفاتيح وأيقونة الرسائل", () => {
  it("يطلب من Android تصغير مساحة التطبيق فوق لوحة المفاتيح", () => {
    expect(readSource("app.config.ts")).toContain('softwareKeyboardLayoutMode: "resize"');
  });

  it("يرفع نماذج الحساب وواجهة كتابة الرسالة فوق لوحة المفاتيح", () => {
    const signIn = readSource("app/sign-in.tsx");
    const signUp = readSource("app/sign-up.tsx");
    const chat = readSource("app/chat/[id].tsx");

    expect(signIn).toContain('behavior={Platform.OS === "ios" ? "padding" : "height"}');
    expect(signUp).toContain('behavior={Platform.OS === "ios" ? "padding" : "height"}');
    expect(chat).toContain('behavior={Platform.OS === "ios" ? "padding" : "height"}');
    expect(chat).toContain("keyboardShouldPersistTaps=\"handled\"");
  });

  it("يعرض زر المحادثة الجديدة كفقاعة خضراء تتوسطها علامة زائد", () => {
    const conversations = readSource("app/(tabs)/index.tsx");
    const icons = readSource("components/app-icon.tsx");

    expect(conversations).toContain('<AppIcon name="chat-plus" size={24} color="#138A5B" />');
    expect(conversations).toContain("width: 48, height: 48");
    expect(icons).toContain('if (name === "edit")');
  });
});
