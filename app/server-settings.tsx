import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppIcon } from "@/components/app-icon";
import { ScreenContainer } from "@/components/screen-container";
import { DEFAULT_MESSENGER_SERVER, messengerAuth, MESSENGER_SERVER_NAME } from "@/lib/messenger-auth";
import { serverConfigStore } from "@/lib/server-config";
import { buildHealthUrl, validateServerSettings } from "@/lib/server-validation";
import { getNativePalette } from "@/lib/native-palette";
import { useThemeContext } from "@/lib/theme-provider";

export default function ServerSettingsScreen() {
  const { colorScheme } = useThemeContext();
  const palette = getNativePalette(colorScheme);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_MESSENGER_SERVER);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");
  const [statusText, setStatusText] = useState("يمكنك اختبار عنوان الخادم أو تغييره.");

  useEffect(() => {
    void serverConfigStore.load().then((settings) => {
      if (settings.baseUrl) setBaseUrl(settings.baseUrl);
    });
  }, []);

  const test = async () => {
    const validation = validateServerSettings({ baseUrl, apiPath: "/v1/health" });
    if (!validation.valid) {
      setStatus("error");
      setStatusText(validation.message);
      return;
    }
    setTesting(true);
    try {
      const response = await fetch(buildHealthUrl({ baseUrl: validation.normalizedBaseUrl, apiPath: "/v1/health" }));
      if (!response.ok) throw new Error();
      setStatus("ready");
      setStatusText("الخادم متاح ويمكن الوصول إليه.");
    } catch {
      setStatus("error");
      setStatusText("تعذر الوصول إلى الخادم. تحقق من العنوان والإنترنت.");
    } finally {
      setTesting(false);
    }
  };

  const saveAddress = async () => {
    const validation = validateServerSettings({ baseUrl, apiPath: "/v1/health" });
    if (!validation.valid) {
      setStatus("error");
      setStatusText(validation.message);
      return;
    }
    await messengerAuth.clearSavedServerData();
    await serverConfigStore.save({
      baseUrl: validation.normalizedBaseUrl,
      apiPath: "/v1/health",
      mediaPath: "/v1/media",
      conversationsPath: "/v1/conversations",
      realtimePath: "/v1/realtime",
      icePath: "/v1/calls/ice",
      token: "",
    });
    router.replace("/" as never);
  };

  const clear = () =>
    Alert.alert("مسح بيانات الخادم", "سيتم حذف جلسة الدخول والبيانات المحفوظة لهذا الخادم من هذا الجهاز.", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "مسح البيانات",
        style: "destructive",
        onPress: () => {
          void messengerAuth.clearSavedServerData().then(() => router.replace("/" as never));
        },
      },
    ]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="bg-background" containerClassName="bg-background">
      <View style={[styles.topBar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <Pressable accessibilityLabel="الرجوع" onPress={() => router.back()} style={styles.back}>
          <AppIcon name="chevron-left" size={25} color={palette.text} />
        </Pressable>
        <Text style={[styles.topTitle, { color: palette.text }]}>بيانات الخادم</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: palette.background }]}>
        <View style={[styles.banner, { backgroundColor: palette.surfaceRaised }]}>
          <View style={[styles.bannerIcon, { backgroundColor: palette.surface }]}>
            <AppIcon name="dns" size={25} color={palette.primary} />
          </View>
          <View style={styles.bannerCopy}>
            <Text style={[styles.bannerTitle, { color: palette.text }]}>{MESSENGER_SERVER_NAME}</Text>
            <Text style={[styles.bannerText, { color: palette.muted }]}>
              جلسة الحساب تحفظ على هذا الجهاز. لا نعرض رمز الجلسة أو كلمة المرور هنا.
            </Text>
          </View>
        </View>

        <Text style={[styles.label, { color: palette.text }]}>عنوان الخادم</Text>
        <TextInput
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="https://server.example.com"
          placeholderTextColor={palette.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={[styles.field, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
          textAlign="left"
        />

        <View
          style={[
            styles.status,
            status === "ready"
              ? { backgroundColor: palette.notice }
              : status === "error"
              ? { backgroundColor: "#FFF0F1" }
              : { backgroundColor: palette.surfaceRaised },
          ]}
        >
          <AppIcon
            name={status === "ready" ? "check-circle-outline" : status === "error" ? "error-outline" : "info-outline"}
            size={20}
            color={status === "ready" ? "#138A5B" : status === "error" ? "#C83D4B" : palette.muted}
          />
          <Text style={[styles.statusText, { color: palette.text }]}>{statusText}</Text>
        </View>

        <Pressable
          disabled={testing}
          onPress={() => void test()}
          style={({ pressed }) => [styles.testButton, { borderColor: palette.primary }, testing && styles.disabled, pressed && styles.pressed]}
        >
          {testing ? (
            <ActivityIndicator color={palette.primary} />
          ) : (
            <>
              <AppIcon name="wifi-tethering" size={20} color={palette.primary} />
              <Text style={[styles.testText, { color: palette.primary }]}>اختبار الاتصال</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => void saveAddress()}
          style={({ pressed }) => [styles.saveButton, { backgroundColor: palette.surfaceRaised, borderColor: palette.primary }, pressed && styles.pressed]}
        >
          <Text style={[styles.saveText, { color: colorScheme === "dark" ? palette.text : palette.primary }]}>حفظ عنوان جديد</Text>
        </Pressable>

        <Pressable onPress={clear} style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
          <AppIcon name="delete" size={19} color="#C83D4B" />
          <Text style={styles.clearText}>مسح بيانات الخادم المحفوظة</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { height: 64, paddingHorizontal: 16, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topTitle: { fontSize: 18, fontWeight: "800" },
  scroll: { padding: 20, gap: 16, flexGrow: 1 },
  banner: { flexDirection: "row", gap: 12, padding: 15, borderRadius: 18 },
  bannerIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  bannerCopy: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: "800", textAlign: "right", writingDirection: "rtl" },
  bannerText: { fontSize: 12.5, lineHeight: 19, marginTop: 4, textAlign: "right", writingDirection: "rtl" },
  label: { fontSize: 13, fontWeight: "800", textAlign: "right", writingDirection: "rtl" },
  field: { minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, fontSize: 14, writingDirection: "ltr" },
  status: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 50, padding: 12, borderRadius: 14 },
  statusText: { flex: 1, fontSize: 12.5, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
  testButton: { height: 48, borderWidth: 1.5, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  testText: { fontSize: 15, fontWeight: "800" },
  saveButton: { height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  saveText: { fontSize: 15, fontWeight: "800" },
  clearButton: { minHeight: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row-reverse", gap: 7, backgroundColor: "#FFF5F6", borderWidth: 1, borderColor: "#F1C7CD" },
  clearText: { color: "#C83D4B", fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.55 },
});
