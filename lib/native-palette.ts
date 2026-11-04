import type { ColorScheme } from "@/constants/theme";

export type NativePalette = {
  background: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  muted: string;
  border: string;
  input: string;
  notice: string;
  noticeText: string;
  primary: string;
};

const LIGHT: NativePalette = {
  background: "#F7F9FE",
  surface: "#FFFFFF",
  surfaceRaised: "#EDF3FE",
  text: "#10233F",
  muted: "#6C7890",
  border: "#E0E7F3",
  input: "#F3F6FB",
  notice: "#EAF6F0",
  noticeText: "#267153",
  primary: "#0B5FFF",
};

const DARK: NativePalette = {
  background: "#101826",
  surface: "#172235",
  surfaceRaised: "#22324B",
  text: "#F4F7FE",
  muted: "#AEBBD0",
  border: "#2A3A54",
  input: "#202E44",
  notice: "#17392F",
  noticeText: "#9DE1BE",
  primary: "#75A2FF",
};

export function getNativePalette(scheme: ColorScheme): NativePalette {
  return scheme === "dark" ? DARK : LIGHT;
}
