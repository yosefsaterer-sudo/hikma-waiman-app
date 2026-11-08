import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { AppIcon } from "@/components/app-icon";
import { ScreenContainer } from "@/components/screen-container";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  enableLocalNotifications,
  loadNotificationSettings,
  saveNotificationSettings,
  sendDemoMessageNotification,
  type NotificationSettings,
} from "@/lib/notification-service";
import { getNativePalette } from "@/lib/native-palette";
import { useThemeContext } from "@/lib/theme-provider";

export default function NotificationsScreen() {
  const { colorScheme } = useThemeContext();
  const palette = getNativePalette(colorScheme);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    loadNotificationSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = async <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveNotificationSettings(updated);
  };

  const toggleMaster = async (value: boolean) => {
    if (value) {
      const result = await enableLocalNotifications();
      const activated = result === "scheduled" || result === "preview";
      await updateSetting("enabled", activated);
      if (result === "preview") setFeedback("المعاينة: تم تفعيل التنبيهات داخل هذه الواجهة. إشعار النظام يحتاج نسخة Android.");
      else if (!activated) {
        setFeedback("لم يُسمح بإشعارات النظام.");
        Alert.alert("الإشعارات غير مفعلة", "اسمح بالإشعارات من إعدادات النظام لتلقي التنبيهات المحلية.");
      }
      return;
    }
    await updateSetting("enabled", false);
    setFeedback("تم إيقاف التنبيهات.");
  };

  const sendTest = async () => {
    const result = await sendDemoMessageNotification();
    if (result === "preview") setFeedback("رسالة تجريبية: أرسلت ليلى صورة جديدة في محادثة التجربة.");
    else if (result === "scheduled") {
      setFeedback("تمت جدولة إشعار الجهاز التجريبي.");
      Alert.alert("تم إرسال إشعار تجريبي", "سيصل تنبيه محلي خلال لحظة على جهازك.");
    } else {
      setFeedback("فعّل التنبيهات أولًا ثم أعد التجربة.");
      Alert.alert("فعّل الإشعارات أولاً", "فعّل التنبيهات المحلية ثم جرّب الإشعار.");
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="bg-background" containerClassName="bg-background">
      <View style={[styles.topBar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <AppIcon name="chevron-left" size={24} color={palette.text} />
        </Pressable>
        <Text style={[styles.title, { color: palette.text }]}>الإشعارات</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: palette.background }]}>
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: palette.surfaceRaised }]}>
            <AppIcon name="notifications-active" size={29} color={palette.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: palette.text }]}>إعدادات الإشعارات</Text>
          <Text style={[styles.heroCopy, { color: palette.muted }]}>
            تحكم في كيفية وصول التنبيهات إليك.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <SettingRow
            title="تفعيل الإشعارات"
            detail="تشغيل أو إيقاف جميع الإشعارات"
            value={settings.enabled}
            disabled={loading}
            onValueChange={toggleMaster}
            palette={palette}
          />
        </View>

        {settings.enabled ? (
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <SettingRow
              title="الصوت"
              detail="تشغيل صوت عند وصول إشعار"
              value={settings.sound}
              onValueChange={(value) => void updateSetting("sound", value)}
              palette={palette}
            />
            <View style={[styles.line, { backgroundColor: palette.border }]} />
            <SettingRow
              title="الاهتزاز"
              detail="اهتزاز الجهاز عند وصول إشعار"
              value={settings.vibration}
              onValueChange={(value) => void updateSetting("vibration", value)}
              palette={palette}
            />
            <View style={[styles.line, { backgroundColor: palette.border }]} />
            <SettingRow
              title="معاينة الرسائل"
              detail="عرض نص الرسالة في الإشعار"
              value={settings.preview}
              onValueChange={(value) => void updateSetting("preview", value)}
              palette={palette}
            />
            <View style={[styles.line, { backgroundColor: palette.border }]} />
            <SettingRow
              title="إشعارات المجموعات"
              detail="تلقي إشعارات من المجموعات"
              value={settings.groups}
              onValueChange={(value) => void updateSetting("groups", value)}
              palette={palette}
            />
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Pressable onPress={sendTest} style={({ pressed }) => [styles.testButton, pressed && styles.pressed]}>
            <AppIcon name="notifications" size={20} color={palette.primary} />
            <Text style={[styles.testText, { color: palette.primary }]}>إرسال إشعار تجريبي</Text>
          </Pressable>
        </View>

        {feedback ? (
          <View style={[styles.feedback, { backgroundColor: palette.notice }]}>
            <AppIcon name="check-circle-outline" size={18} color="#138A5B" />
            <Text style={[styles.feedbackText, { color: palette.noticeText }]}>{feedback}</Text>
          </View>
        ) : null}

        {Platform.OS === "web" ? (
          <View style={[styles.previewNote, { backgroundColor: palette.surfaceRaised }]}>
            <Text style={[styles.previewNoteText, { color: palette.muted }]}>
              في المعاينة ستظهر نتيجة الاختبار هنا. إشعار شريط النظام يُختبر لاحقًا في نسخة Android.
            </Text>
          </View>
        ) : null}

        <View style={[styles.info, { backgroundColor: palette.surfaceRaised }]}>
          <AppIcon name="info-outline" size={19} color={palette.primary} />
          <Text style={[styles.infoText, { color: palette.text }]}>
            هذه إشعارات محلية للتجربة. يتطلب إرسال إشعارات من خادمك لاحقًا تسجيل رمز الجهاز لدى خدمة الإشعارات.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SettingRow({
  title,
  detail,
  value,
  disabled,
  onValueChange,
  palette,
}: {
  title: string;
  detail: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
  palette: ReturnType<typeof getNativePalette>;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.rowDetail, { color: palette.muted }]}>{detail}</Text>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: palette.border, true: palette.primary + "80" }}
        thumbColor={value ? palette.primary : palette.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { height: 64, paddingHorizontal: 16, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1 },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  title: { fontSize: 18, fontWeight: "900" },
  scroll: { padding: 20, minHeight: "100%" },
  hero: { alignItems: "center", paddingVertical: 24 },
  heroIcon: { width: 62, height: 62, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 20, fontWeight: "900", marginTop: 12 },
  heroCopy: { fontSize: 13.5, lineHeight: 21, textAlign: "center", marginTop: 5, writingDirection: "rtl" },
  card: { borderRadius: 18, borderWidth: 1, overflow: "hidden", marginBottom: 14 },
  row: { minHeight: 70, paddingHorizontal: 15, flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  rowCopy: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "800", textAlign: "right", writingDirection: "rtl" },
  rowDetail: { fontSize: 11.5, marginTop: 3, textAlign: "right", writingDirection: "rtl" },
  line: { height: 1 },
  testButton: { minHeight: 54, flexDirection: "row-reverse", justifyContent: "center", alignItems: "center", gap: 8 },
  testText: { fontSize: 14.5, fontWeight: "900" },
  feedback: { marginTop: 14, padding: 12, borderRadius: 14, flexDirection: "row-reverse", gap: 8, alignItems: "center" },
  feedbackText: { flex: 1, fontSize: 12.5, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  previewNote: { marginTop: 12, padding: 12, borderRadius: 14 },
  previewNoteText: { fontSize: 12, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
  info: { marginTop: 18, flexDirection: "row-reverse", alignItems: "flex-start", gap: 8, padding: 13, borderRadius: 15 },
  infoText: { flex: 1, fontSize: 12.5, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
