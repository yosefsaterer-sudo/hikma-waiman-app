import type { ChatBackground, ThemePreference } from "@/lib/theme-provider";

export const CHAT_BACKGROUNDS: Record<ChatBackground, { label: string; light: string; dark: string; accent: string }> = {
  mist: { label: "ضبابي", light: "#F7F9FE", dark: "#111827", accent: "#DCE8FB" },
  sand: { label: "رملي", light: "#FFF9EE", dark: "#262015", accent: "#F5E5C6" },
  sky: { label: "سماوي", light: "#EFF7FF", dark: "#10253B", accent: "#CFE8FF" },
  night: { label: "ليلي", light: "#EEF0F6", dark: "#0B1020", accent: "#CBD3E8" },
  custom: { label: "مخصصة", light: "#EAF1FF", dark: "#17243A", accent: "#BFD4FF" },
};

export const THEME_OPTIONS: { value: ThemePreference; label: string; description: string }[] = [
  { value: "system", label: "حسب النظام", description: "يتبع إعداد الجهاز" },
  { value: "light", label: "فاتح", description: "خلفية واضحة ومضيئة" },
  { value: "dark", label: "داكن", description: "ألوان مريحة لليل" },
];
