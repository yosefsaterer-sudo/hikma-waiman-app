import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppIcon, type AppIconName } from "@/components/app-icon";
import { ScreenContainer } from "@/components/screen-container";
import { messengerAuth, MESSENGER_SERVER_NAME } from "@/lib/messenger-auth";
import { getNativePalette } from "@/lib/native-palette";
import { useThemeContext } from "@/lib/theme-provider";

export default function SettingsScreen() {
  const { colorScheme } = useThemeContext();
  const palette = getNativePalette(colorScheme);
  const [username, setUsername] = useState("الحساب");

  useEffect(() => {
    void messengerAuth.loadSession().then((session) => setUsername(session?.username || "الحساب"));
  }, []);

  return (
    <ScreenContainer className="bg-background" containerClassName="bg-background">
      <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: palette.background }]}>
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: palette.primary }]}>الحساب والحماية</Text>
          <Text style={[styles.title, { color: palette.text }]}>الإعدادات</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="فتح الحساب"
          onPress={() => router.push("/account" as never)}
          style={({ pressed }) => [styles.account, { backgroundColor: palette.surface, borderColor: palette.border }, pressed && styles.pressed]}
        >
          <View style={styles.accountAvatar}>
            <Text style={styles.accountAvatarText}>{username.slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={styles.accountCopy}>
            <Text style={[styles.accountName, { color: palette.text }]}>{username}</Text>
            <Text style={[styles.accountHint, { color: palette.muted }]}>متصل بـ {MESSENGER_SERVER_NAME}</Text>
          </View>
        </Pressable>

        <Text style={[styles.sectionTitle, { color: palette.muted }]}>الحماية والاتصال</Text>
        <SettingsRow
          palette={palette}
          icon="verified-user"
          color="#138A5B"
          title="الخصوصية والأمان"
          detail="كلمة المرور وجلسة الحساب"
          onPress={() => router.push("/privacy-security" as never)}
        />
        <SettingsRow
          palette={palette}
          icon="dns"
          color="#0B5FFF"
          title="بيانات الخادم"
          detail="تعديل العنوان أو مسح البيانات المحفوظة"
          onPress={() => router.push("/server-settings" as never)}
        />

        <Text style={[styles.sectionTitle, { color: palette.muted }]}>التطبيق</Text>
        <SettingsRow
          palette={palette}
          icon="notifications-none"
          color="#8259D5"
          title="الإشعارات"
          detail="التنبيهات المحلية وتجربة الرسائل"
          onPress={() => router.push("/notifications" as never)}
        />
        <SettingsRow
          palette={palette}
          icon="settings"
          color="#0B5FFF"
          title="المظهر والخلفية"
          detail="فاتح أو داكن وخلفية المحادثة"
          onPress={() => router.push("/appearance" as never)}
        />
        <SettingsRow
          palette={palette}
          icon="download"
          color="#0B5FFF"
          title="التنزيل التلقائي"
          detail="التحكم في تنزيل الوسائط حسب نوع الشبكة"
          onPress={() => router.push("/download-settings" as never)}
        />
        <SettingsRow
          palette={palette}
          icon="folder"
          color="#D06E37"
          title="إدارة التخزين"
          detail="عرض وحذف الملفات المحملة"
          onPress={() => router.push("/storage-settings" as never)}
        />
        <SettingsRow
          palette={palette}
          icon="file-download"
          color="#8259D5"
          title="الملفات المحملة"
          detail="عرض ومشاركة وحذف الملفات"
          onPress={() => router.push("/downloaded-media" as never)}
        />
        <SettingsRow
          palette={palette}
          icon="info-outline"
          color="#6C7890"
          title="حول حكمة وإيمان"
          detail="معلومات النسخة والخادم"
          onPress={() => router.push("/about" as never)}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

function SettingsRow({
  palette,
  icon,
  color,
  title,
  detail,
  onPress,
}: {
  palette: ReturnType<typeof getNativePalette>;
  icon: AppIconName;
  color: string;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: palette.surface, borderBottomColor: palette.border }, pressed && styles.pressed]}
    >
      <View style={[styles.iconBox, { backgroundColor: `${color}16` }]}>
        <AppIcon name={icon} size={21} color={color} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.rowDetail, { color: palette.muted }]}>{detail}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 34, minHeight: "100%" },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 },
  kicker: { fontSize: 13, fontWeight: "800", textAlign: "right" },
  title: { fontSize: 31, lineHeight: 40, fontWeight: "800", textAlign: "right" },
  account: { marginHorizontal: 20, padding: 15, flexDirection: "row-reverse", alignItems: "center", gap: 12, borderRadius: 18, borderWidth: 1 },
  accountAvatar: { width: 50, height: 50, alignItems: "center", justifyContent: "center", borderRadius: 25, backgroundColor: "#10233F" },
  accountAvatarText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  accountCopy: { flex: 1 },
  accountName: { fontSize: 16, fontWeight: "800", textAlign: "right", writingDirection: "rtl" },
  accountHint: { fontSize: 12.5, marginTop: 4, textAlign: "right", writingDirection: "rtl" },
  sectionTitle: { fontSize: 13, fontWeight: "800", textAlign: "right", marginHorizontal: 20, marginTop: 24, marginBottom: 8 },
  row: { marginHorizontal: 20, minHeight: 74, paddingHorizontal: 14, flexDirection: "row-reverse", alignItems: "center", gap: 12, borderBottomWidth: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowCopy: { flex: 1 },
  rowTitle: { fontSize: 15.5, fontWeight: "800", textAlign: "right", writingDirection: "rtl" },
  rowDetail: { fontSize: 12, marginTop: 3, textAlign: "right", writingDirection: "rtl" },
  pressed: { opacity: 0.68 },
});
