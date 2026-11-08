export type ThemeVariablePalette = {
  primary: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
};

/**
 * NativeWind resolves tokens such as bg-background through standard CSS custom
 * properties. The leading "--" is required in both web and native builds.
 */
export function buildThemeVariables(colors: ThemeVariablePalette) {
  return {
    "--color-primary": colors.primary,
    "--color-background": colors.background,
    "--color-surface": colors.surface,
    "--color-foreground": colors.foreground,
    "--color-muted": colors.muted,
    "--color-border": colors.border,
    "--color-success": colors.success,
    "--color-warning": colors.warning,
    "--color-error": colors.error,
  };
}
