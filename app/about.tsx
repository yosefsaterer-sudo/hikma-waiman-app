import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppIcon } from "@/components/app-icon";
import { ScreenContainer } from "@/components/screen-container";
import { getNativePalette } from "@/lib/native-palette";
import { useThemeContext } from "@/lib/theme-provider";

export default function AboutScreen() {
  const { colorScheme } = useThemeContext();
  const palette = getNativePalette(colorScheme);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="bg-background" containerClassName="bg-background">
      <View style={[styles.topBar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <Pressable accessibilityLabel="الرجوع" onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <AppIcon name="chevron-left" size={25} color={palette.text} />
        </Pressable>
        <Text style={[styles.title, { color: palette.text }]}>حول حكمة وإيمان</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: palette.background }]}>
        <View style={styles.brand}>
          <View style={[styles.brandIcon, { backgroundColor: palette.primary }]}>
            <AppIcon name="forum" size={34} color="#FFFFFF" />
          </View>
          <Text style={[styles.name, { color: palette.text }]}>حكمة وإيمان</Text>
          <Text style={[styles.version, { color: palette.primary }]}>نسخة 1.7.1</Text>
          <Text style={[styles.copy, { color: palette.muted }]}>
            واجهة مراسلة عربية محلية للتجربة، قابلة للربط لاحقًا بخادم خاص متوافق.
          </Text>
        </View>

        <InfoRow title="وضع التجربة" value="تعمل المحادثات والمرفقات محليًا على الجهاز" palette={palette} />
        <InfoRow title="الخادم الخاص" value="يمكن إعداد المسارات ورمز الاتصال من صفحة الخادم" palette={palette} />
        <InfoRow title="الرسائل الصوتية" value="تتطلب السماح بإذن الميكروفون" palette={palette} />

        <View style={[styles.note, { backgroundColor: palette.surfaceRaised }]}>
          <Text style={[styles.noteText, { color: palette.muted }]}>
            لا تستخدم هذه المعاينة لتبادل معلومات حساسة قبل إعداد خادم موثوق وبروتوكول أمان معتمد.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoRow({ title, value, palette }: { title: string; value: string; palette: ReturnType<typeof getNativePalette> }) {
  return (
    <View style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Text style={[styles.rowTitle, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.rowValue, { color: palette.muted }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { height: 64, paddingHorizontal: 16, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  title: { fontSize: 18, fontWeight: "900" },
  scroll: { flexGrow: 1, padding: 20 },
  brand: { alignItems: "center", paddingVertical: 26 },
  brandIcon: { width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 23, fontWeight: "900", marginTop: 14 },
  version: { fontSize: 12.5, fontWeight: "800", marginTop: 5 },
  copy: { textAlign: "center", writingDirection: "rtl", fontSize: 13, lineHeight: 21, marginTop: 12 },
  row: { padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  rowTitle: { fontSize: 15, fontWeight: "800", textAlign: "right", writingDirection: "rtl" },
  rowValue: { fontSize: 12.5, marginTop: 5, textAlign: "right", writingDirection: "rtl", lineHeight: 19 },
  note: { padding: 14, borderRadius: 15, marginTop: 8 },
  noteText: { fontSize: 12, textAlign: "right", writingDirection: "rtl", lineHeight: 19 },
  pressed: { opacity: 0.68 },
});
