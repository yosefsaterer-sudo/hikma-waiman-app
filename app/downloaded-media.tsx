import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

import { AppIcon } from "@/components/app-icon";
import { ScreenContainer } from "@/components/screen-container";
import { deleteMediaLocally, formatStorageSize, getAllDownloadedMedia, type DownloadedMedia } from "@/lib/storage-manager";
import { getNativePalette } from "@/lib/native-palette";
import { useThemeContext } from "@/lib/theme-provider";

const KIND_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  image: { label: "صورة", icon: "image", color: "#0B5FFF" },
  video: { label: "فيديو", icon: "play-circle-filled", color: "#D06E37" },
  audio: { label: "صوت", icon: "audiotrack", color: "#8259D5" },
  file: { label: "مستند", icon: "insert-drive-file", color: "#138A5B" },
};

export default function DownloadedMediaScreen() {
  const { colorScheme } = useThemeContext();
  const palette = getNativePalette(colorScheme);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<DownloadedMedia[]>([]);
  const [filter, setFilter] = useState<"all" | "image" | "video" | "audio" | "file">("all");

  const loadFiles = async () => {
    setLoading(true);
    const result = await getAllDownloadedMedia();
    setFiles(result);
    setLoading(false);
  };

  useEffect(() => {
    void loadFiles();
  }, []);

  const filtered = filter === "all" ? files : files.filter((f) => f.mimeType.startsWith(filter + "/"));

  const handleDelete = (media: DownloadedMedia) => {
    Alert.alert("حذف الملف", `سيتم حذف "${media.name}". هل أنت متأكد؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          await deleteMediaLocally(media.mediaId);
          await loadFiles();
        },
      },
    ]);
  };

  const handleShare = async (media: DownloadedMedia) => {
    try {
      const info = await FileSystem.getInfoAsync(media.localUri);
      if (!info.exists) {
        Alert.alert("الملف غير موجود", "ربما تم حذفه.");
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(media.localUri, { dialogTitle: `مشاركة ${media.name}` });
      }
    } catch {
      Alert.alert("تعذر المشاركة", "حاول مرة أخرى.");
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="bg-background" containerClassName="bg-background">
      <View style={[styles.topBar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <Pressable accessibilityLabel="الرجوع" onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <AppIcon name="chevron-left" size={25} color={palette.text} />
        </Pressable>
        <Text style={[styles.title, { color: palette.text }]}>الملفات المحملة</Text>
        <View style={styles.back} />
      </View>

      <View style={styles.filters}>
        <FilterChip label="الكل" active={filter === "all"} onPress={() => setFilter("all")} palette={palette} />
        <FilterChip label="صور" active={filter === "image"} onPress={() => setFilter("image")} palette={palette} />
        <FilterChip label="فيديو" active={filter === "video"} onPress={() => setFilter("video")} palette={palette} />
        <FilterChip label="صوت" active={filter === "audio"} onPress={() => setFilter("audio")} palette={palette} />
        <FilterChip label="مستندات" active={filter === "file"} onPress={() => setFilter("file")} palette={palette} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <AppIcon name="folder-open" size={60} color={palette.muted} />
          <Text style={[styles.emptyText, { color: palette.muted }]}>لا توجد ملفات محملة.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.mediaId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const kind = item.mimeType.split("/")[0];
            const info = KIND_LABELS[kind] || KIND_LABELS.file;
            const isImage = kind === "image";

            return (
              <View style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                {isImage ? (
                  <Image source={{ uri: item.localUri }} style={styles.thumbnail} />
                ) : (
                  <View style={[styles.iconBox, { backgroundColor: `${info.color}16` }]}>
                    <AppIcon name={info.icon as any} size={26} color={info.color} />
                  </View>
                )}
                <View style={styles.rowCopy}>
                  <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.text }]}>{item.name}</Text>
                  <Text style={[styles.rowDetail, { color: palette.muted }]}>
                    {info.label} · {formatStorageSize(item.size)}
                  </Text>
                </View>
                <Pressable onPress={() => void handleShare(item)} style={({ pressed }) => [styles.actionButton, { backgroundColor: palette.surfaceRaised }, pressed && styles.pressed]}>
                  <AppIcon name="share" size={18} color={palette.primary} />
                </Pressable>
                <Pressable onPress={() => handleDelete(item)} style={({ pressed }) => [styles.actionButton, { backgroundColor: "#FFF5F6" }, pressed && styles.pressed]}>
                  <AppIcon name="delete-outline" size={18} color="#C83D4B" />
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

function FilterChip({ label, active, onPress, palette }: { label: string; active: boolean; onPress: () => void; palette: ReturnType<typeof getNativePalette> }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: palette.surface, borderColor: palette.border },
        active && { backgroundColor: palette.surfaceRaised, borderColor: palette.primary },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, { color: active ? palette.primary : palette.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: { height: 64, paddingHorizontal: 16, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  title: { fontSize: 18, fontWeight: "900" },
  filters: { flexDirection: "row-reverse", gap: 8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, flexWrap: "wrap" },
  chip: { minHeight: 32, paddingHorizontal: 14, justifyContent: "center", borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 12.5, fontWeight: "800", textAlign: "center" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center", writingDirection: "rtl" },
  list: { padding: 20, gap: 10 },
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 10, padding: 10, borderRadius: 15, borderWidth: 1 },
  thumbnail: { width: 52, height: 52, borderRadius: 10 },
  iconBox: { width: 52, height: 52, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14.5, fontWeight: "800", textAlign: "right", writingDirection: "rtl" },
  rowDetail: { fontSize: 11.5, marginTop: 3, textAlign: "right", writingDirection: "rtl" },
  actionButton: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
