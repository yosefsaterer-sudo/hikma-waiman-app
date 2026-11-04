import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppIcon } from "@/components/app-icon";
import { ScreenContainer } from "@/components/screen-container";
import {
  calculateStorageUsage,
  clearAllDownloadedMedia,
  clearMediaByKind,
  formatStorageSize,
  choosePublicStorageDirectory,
} from "@/lib/storage-manager";
import type { MediaKind } from "@/lib/messenger-models";
import { getNativePalette } from "@/lib/native-palette";
import { useThemeContext } from "@/lib/theme-provider";

const KIND_LABELS: Record<MediaKind, { label: string; icon: string; color: string }> = {
  image: { label: "الصور", icon: "image", color: "#0B5FFF" },
  video: { label: "الفيديو", icon: "play-circle-filled", color: "#D06E37" },
  audio: { label: "الصوت", icon: "audiotrack", color: "#8259D5" },
  file: { label: "المستندات", icon: "insert-drive-file", color: "#138A5B" },
};

export default function StorageSettingsScreen() {
  const { colorScheme } = useThemeContext();
  const palette = getNativePalette(colorScheme);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<{ total: number; byKind: Record<MediaKind, number> }>({
    total: 0,
    byKind: { image: 0, video: 0, audio: 0, file: 0 },
  });

  const loadUsage = async () => {
    setLoading(true);
    const result = await calculateStorageUsage();
    setUsage(result);
    setLoading(false);
  };

  useEffect(() => {
    void loadUsage();
  }, []);

  const handleClearKind = (kind: MediaKind) => {
    const label = KIND_LABELS[kind].label;
    Alert.alert(
      `حذف ${label}`,
      `سيتم حذف جميع الملفات من نوع "${label}". هل أنت متأكد؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            await clearMediaByKind(kind);
            await loadUsage();
            Alert.alert("تم الحذف", `تم حذف جميع ${label}.`);
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "حذف جميع الملفات",
      "سيتم حذف جميع الصور والفيديو والصوت والمستندات المحملة. هل أنت متأكد؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف الكل",
          style: "destructive",
          onPress: async () => {
            await clearAllDownloadedMedia();
            await loadUsage();
            Alert.alert("تم الحذف", "تم حذف جميع الملفات المحملة.");
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="bg-background" containerClassName="bg-background">
      <View style={[styles.topBar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <Pressable accessibilityLabel="الرجوع" onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <AppIcon name="chevron-left" size={25} color={palette.text} />
        </Pressable>
        <Text style={[styles.title, { color: palette.text }]}>إدارة التخزين</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: palette.background }]}>
        <View style={[styles.hero, { backgroundColor: palette.surfaceRaised }]}>
          <View style={[styles.heroIcon, { backgroundColor: palette.surface }]}>
            <AppIcon name="folder" size={30} color={palette.primary} />
          </View>
          <Text style={[styles.heroLabel, { color: palette.muted }]}>إجمالي المساحة المستخدمة</Text>
          <Text style={[styles.heroValue, { color: palette.text }]}>
            {loading ? "..." : formatStorageSize(usage.total)}
          </Text>
        </View>

        <Text style={[styles.section, { color: palette.muted }]}>التفاصيل حسب النوع</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            {(Object.keys(KIND_LABELS) as MediaKind[]).map((kind, index) => {
              const info = KIND_LABELS[kind];
              const size = usage.byKind[kind] || 0;
              const isLast = index === Object.keys(KIND_LABELS).length - 1;
              return (
                <View key={kind}>
                  <View style={styles.row}>
                    <View style={[styles.kindIcon, { backgroundColor: `${info.color}16` }]}>
                      <AppIcon name={info.icon as any} size={22} color={info.color} />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={[styles.rowTitle, { color: palette.text }]}>{info.label}</Text>
                      <Text style={[styles.rowDetail, { color: palette.muted }]}>
                        {size > 0 ? formatStorageSize(size) : "لا توجد ملفات"}
                      </Text>
                    </View>
                    {size > 0 ? (
                      <Pressable
                        onPress={() => handleClearKind(kind)}
                        style={({ pressed }) => [styles.deleteButton, { backgroundColor: "#FFF5F6" }, pressed && styles.pressed]}
                      >
                        <AppIcon name="delete-outline" size={18} color="#C83D4B" />
                      </Pressable>
                    ) : null}
                  </View>
                  {!isLast ? <View style={[styles.line, { backgroundColor: palette.border }]} /> : null}
                </View>
              );
            })}
          </View>
        )}

        <Pressable onPress={async () => { const ok = await choosePublicStorageDirectory(); Alert.alert(ok ? "تم إنشاء المجلد" : "تعذر إنشاء المجلد", ok ? "تم تجهيز مجلد hekma-aiman ومجلداته في المكان الذي اخترته. ستبقى نسخة التشغيل داخل كاش التطبيق لتعمل دون اتصال." : "اسمح للتطبيق باختيار مجلد في التخزين الداخلي ثم حاول مرة أخرى."); }} style={({ pressed }) => [styles.backupButton, { backgroundColor: palette.surface, borderColor: palette.primary }, pressed && styles.pressed]}><AppIcon name="folder-open" size={19} color={palette.primary} /><Text style={[styles.backupText, { color: palette.primary }]}>تهيئة مجلد النسخ الاحتياطي</Text></Pressable>

        {usage.total > 0 ? (
          <Pressable onPress={handleClearAll} style={({ pressed }) => [styles.clearAll, pressed && styles.pressed]}>
            <AppIcon name="delete-forever" size={20} color="#C83D4B" />
            <Text style={styles.clearAllText}>حذف جميع الملفات</Text>
          </Pressable>
        ) : null}

        <View style={[styles.note, { backgroundColor: palette.surfaceRaised }]}>
          <AppIcon name="info-outline" size={18} color={palette.primary} />
          <Text style={[styles.noteText, { color: palette.text }]}>
            يتم تخزين الملفات محلياً على هذا الجهاز. حذفها لا يؤثر على الملفات الموجودة على الخادم.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { height: 64, paddingHorizontal: 16, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  title: { fontSize: 18, fontWeight: "900" },
  scroll: { flexGrow: 1, padding: 20 },
  hero: { alignItems: "center", padding: 24, borderRadius: 20, marginBottom: 20 },
  heroIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heroLabel: { fontSize: 13, fontWeight: "700" },
  heroValue: { fontSize: 32, fontWeight: "900", marginTop: 4 },
  section: { fontSize: 13, fontWeight: "900", textAlign: "right", writingDirection: "rtl", marginBottom: 8, marginTop: 10 },
  loadingBox: { padding: 40, alignItems: "center" },
  card: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  row: { minHeight: 72, paddingHorizontal: 14, flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  kindIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  rowCopy: { flex: 1 },
  rowTitle: { fontSize: 15.5, fontWeight: "800", textAlign: "right", writingDirection: "rtl" },
  rowDetail: { fontSize: 12, marginTop: 3, textAlign: "right", writingDirection: "rtl" },
  line: { height: 1 },
  deleteButton: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  backupButton: { marginTop: 16, height: 50, borderRadius: 14, borderWidth: 1, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8 },
  backupText: { fontSize: 14, fontWeight: "800" },
  clearAll: { marginTop: 20, height: 52, borderRadius: 15, borderWidth: 1.5, borderColor: "#F1C7CD", backgroundColor: "#FFF5F6", flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8 },
  clearAllText: { color: "#C83D4B", fontSize: 14.5, fontWeight: "900" },
  note: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 8, padding: 13, borderRadius: 14, marginTop: 18 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
