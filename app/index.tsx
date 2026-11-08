import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AppIcon } from "@/components/app-icon";
import { ScreenContainer } from "@/components/screen-container";
import { messengerAuth } from "@/lib/messenger-auth";
import { getNativePalette } from "@/lib/native-palette";
import { useThemeContext } from "@/lib/theme-provider";

export default function WelcomeScreen() {
  const { colorScheme } = useThemeContext();
  const palette = getNativePalette(colorScheme);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    void messengerAuth.loadSession().then((session) => {
      if (active && session) router.replace("/(tabs)" as never);
    }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  if (checking) return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={[styles.loading, { backgroundColor: palette.background }]}><ActivityIndicator color={palette.primary} /></View></ScreenContainer>;
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="bg-background" containerClassName="bg-background">
      <View style={[styles.page, { backgroundColor: palette.background }]}>
        <View style={styles.brandMark}><AppIcon name="forum" size={44} color="#FFFFFF" /><View style={styles.lockDot}><AppIcon name="lock" size={13} color="#FFFFFF" /></View></View>
        <Image accessibilityLabel="حكمة وإيمان" source={require("../assets/images/hekma-iman-wordmark.png")} resizeMode="contain" style={styles.wordmark} />
        <Text style={[styles.title, { color: palette.text }]}>تواصل بحسابك{`\n`}بخصوصية أكبر</Text>
        <Text style={[styles.copy, { color: palette.muted }]}>أنشئ حسابًا باسم مستخدم وكلمة مرور، ثم احتفظ برمز الاسترداد في مكان آمن.</Text>
        <View style={[styles.featureCard, { backgroundColor: palette.surface, borderColor: palette.border }]}><Feature icon="verified-user" text="حساب مستقل لكل مستخدم" /><Feature icon="lock" text="كلمات المرور لا تُحفظ كنص ظاهر" /><Feature icon="privacy-tip" text="رمز استرداد عند إنشاء الحساب" /></View>
        <Pressable onPress={() => router.push("/sign-up" as never)} style={({ pressed }) => [styles.primary, { backgroundColor: palette.primary }, pressed && styles.pressed]}><AppIcon name="add" size={21} color="#FFFFFF" /><Text style={styles.primaryText}>إنشاء حساب</Text></Pressable>
        <Pressable onPress={() => router.push("/sign-in" as never)} style={({ pressed }) => [styles.secondary, { borderColor: palette.border }, pressed && styles.pressed]}><Text style={[styles.secondaryText, { color: palette.primary }]}>تسجيل الدخول</Text></Pressable>
      </View>
    </ScreenContainer>
  );
}

function Feature({ icon, text }: { icon: "verified-user" | "lock" | "privacy-tip"; text: string }) {
  return <View style={styles.feature}><View style={styles.featureIcon}><AppIcon name={icon} size={19} color="#0B5FFF" /></View><Text style={styles.featureText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" }, page: { flex: 1, paddingHorizontal: 24, justifyContent: "center", alignItems: "center", backgroundColor: "#F7F9FE" }, brandMark: { width: 94, height: 94, borderRadius: 30, alignItems: "center", justifyContent: "center", backgroundColor: "#10233F", marginBottom: 16, position: "relative", shadowColor: "#10233F", shadowOpacity: 0.18, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 4 }, lockDot: { position: "absolute", bottom: -5, right: -5, width: 28, height: 28, borderRadius: 14, backgroundColor: "#138A5B", borderWidth: 3, borderColor: "#F7F9FE", alignItems: "center", justifyContent: "center" }, wordmark: { width: 265, height: 84, borderRadius: 0, backgroundColor: "transparent", marginBottom: 1 }, title: { fontFamily: "sans-serif", fontSize: 31, lineHeight: 41, fontWeight: "900", textAlign: "center", marginTop: 8, writingDirection: "rtl" }, copy: { fontSize: 15, lineHeight: 24, textAlign: "center", marginTop: 13, writingDirection: "rtl" }, featureCard: { alignSelf: "stretch", borderRadius: 20, padding: 15, marginTop: 26, gap: 12, borderWidth: 1 }, feature: { flexDirection: "row-reverse", alignItems: "center", gap: 10 }, featureIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#EAF1FF", alignItems: "center", justifyContent: "center" }, featureText: { flex: 1, color: "#334A6A", fontSize: 13.5, fontWeight: "700", textAlign: "right", writingDirection: "rtl" }, primary: { alignSelf: "stretch", height: 54, marginTop: 24, borderRadius: 16, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, elevation: 6 }, primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" }, secondary: { alignSelf: "stretch", height: 52, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 12 }, secondaryText: { fontSize: 15, fontWeight: "900" }, pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
