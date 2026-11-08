import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { getNativePalette } from "@/lib/native-palette";
import { useThemeContext } from "@/lib/theme-provider";
import {
  DEFAULT_DOWNLOAD_SETTINGS,
  loadDownloadSettings,
  saveDownloadSettings,
  type DownloadSettings,
  type MediaKindSettings,
  type NetworkType,
} from "@/lib/download-settings";

const NETWORK_LABELS: Record<NetworkType, string> = {
  wifi: "Wi-Fi",
  mobile: "بيانات الجوال",
  roaming: "التجوال",
};

const MEDIA_LABELS: Record<keyof MediaKindSettings, string> = {
  image: "الصور",
  video: "الفيديو",
  audio: "الصوت",
  document: "المستندات",
};

export default function DownloadSettingsScreen() {
  const { colorScheme } = useThemeContext();
  const palette = getNativePalette(colorScheme);
  const [settings, setSettings] = useState<DownloadSettings>(DEFAULT_DOWNLOAD_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadDownloadSettings().then((loaded) => {
      setSettings(loaded);
      setLoading(false);
    });
  }, []);

  const updateNetworkSetting = (
    network: NetworkType,
    kind: keyof MediaKindSettings,
    value: boolean
  ) => {
    const updated: DownloadSettings = {
      ...settings,
      autoDownload: {
        ...settings.autoDownload,
        [network]: {
          ...settings.autoDownload[network],
          [kind]: value,
        },
      },
    };
    setSettings(updated);
    void saveDownloadSettings(updated);
  };

  const toggleAllForNetwork = (network: NetworkType, value: boolean) => {
    const updated: DownloadSettings = {
      ...settings,
      autoDownload: {
        ...settings.autoDownload,
        [network]: { image: value, video: value, audio: value, document: value },
      },
    };
    setSettings(updated);
    void saveDownloadSettings(updated);
  };

  if (loading) {
    return (
      <ScreenContainer className="bg-background">
        <View style={styles.centered}>
          <Text style={{ color: palette.text }}>جارٍ التحميل...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text }]}>التنزيل التلقائي</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>
            اختر أنواع الوسائط التي تريد تنزيلها تلقائياً حسب نوع الشبكة.
          </Text>
        </View>

        {(Object.keys(NETWORK_LABELS) as NetworkType[]).map((network) => (
          <View key={network} style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>
                {NETWORK_LABELS[network]}
              </Text>
              <Pressable
                onPress={() => {
                  const allOn = Object.values(settings.autoDownload[network]).every(Boolean);
                  toggleAllForNetwork(network, !allOn);
                }}
                style={({ pressed }) => [styles.toggleAllButton, pressed && styles.pressed]}
              >
                <Text style={[styles.toggleAllText, { color: palette.primary }]}>
                  {Object.values(settings.autoDownload[network]).every(Boolean) ? "إيقاف الكل" : "تشغيل الكل"}
                </Text>
              </Pressable>
            </View>

            {(Object.keys(MEDIA_LABELS) as Array<keyof MediaKindSettings>).map((kind) => (
              <View key={kind} style={[styles.row, { borderBottomColor: palette.border }]}>
                <Text style={[styles.rowLabel, { color: palette.text }]}>
                  {MEDIA_LABELS[kind]}
                </Text>
                <Switch
                  value={settings.autoDownload[network][kind]}
                  onValueChange={(value) => updateNetworkSetting(network, kind, value)}
                  trackColor={{ false: palette.border, true: palette.primary }}
                />
              </View>
            ))}
          </View>
        ))}

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>جودة الوسائط</Text>

          <View style={[styles.row, { borderBottomColor: palette.border }]}>
            <Text style={[styles.rowLabel, { color: palette.text }]}>جودة تحميل الوسائط</Text>
            <View style={styles.qualityButtons}>
              {(["low", "medium", "high"] as const).map((quality) => (
                <Pressable
                  key={quality}
                  onPress={() => {
                    const updated = { ...settings, downloadQuality: quality };
                    setSettings(updated);
                    void saveDownloadSettings(updated);
                  }}
                  style={[
                    styles.qualityButton,
                    settings.downloadQuality === quality && { backgroundColor: palette.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.qualityButtonText,
                      { color: settings.downloadQuality === quality ? "#FFFFFF" : palette.text },
                    ]}
                  >
                    {quality === "low" ? "منخفضة" : quality === "medium" ? "متوسطة" : "عالية"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: palette.text }]}>جودة التنزيل التلقائي</Text>
            <View style={styles.qualityButtons}>
              {(["low", "medium", "high"] as const).map((quality) => (
                <Pressable
                  key={quality}
                  onPress={() => {
                    const updated = { ...settings, autoDownloadQuality: quality };
                    setSettings(updated);
                    void saveDownloadSettings(updated);
                  }}
                  style={[
                    styles.qualityButton,
                    settings.autoDownloadQuality === quality && { backgroundColor: palette.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.qualityButtonText,
                      { color: settings.autoDownloadQuality === quality ? "#FFFFFF" : palette.text },
                    ]}
                  >
                    {quality === "low" ? "منخفضة" : quality === "medium" ? "متوسطة" : "عالية"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", textAlign: "right" },
  subtitle: { fontSize: 13, marginTop: 8, textAlign: "right", lineHeight: 20 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: "800", textAlign: "right" },
  toggleAllButton: { padding: 6 },
  toggleAllText: { fontSize: 13, fontWeight: "700" },
  row: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  rowLabel: { fontSize: 15, fontWeight: "600", textAlign: "right" },
  qualityButtons: { flexDirection: "row", gap: 6 },
  qualityButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "transparent" },
  qualityButtonText: { fontSize: 12, fontWeight: "700" },
  pressed: { opacity: 0.6 },
});
