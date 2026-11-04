import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppIcon } from "@/components/app-icon";
import { ScreenContainer } from "@/components/screen-container";
import { CHAT_BACKGROUNDS, THEME_OPTIONS } from "@/lib/chat-appearance";
import { getNativePalette } from "@/lib/native-palette";
import { useThemeContext } from "@/lib/theme-provider";

export default function AppearanceScreen() {
  const { colorScheme, themePreference, setThemePreference, chatBackground, setChatBackground, chatBackgroundUri, setChatBackgroundImage } = useThemeContext();
  const palette = getNativePalette(colorScheme);
  const chooseBackground = async (source: "gallery" | "camera") => {
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== "granted") { Alert.alert("إذن الكاميرا", "يلزم السماح بالكاميرا لاختيار خلفية."); return; }
      }
      const result = source === "gallery"
        ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [9, 16], quality: 0.85 })
        : await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [9, 16], quality: 0.85 });
      if (!result.canceled && result.assets[0]?.uri) await setChatBackgroundImage(result.assets[0].uri);
    } catch { Alert.alert("تعذر اختيار الخلفية", "حاول مرة أخرى."); }
  };
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.topBar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <Pressable accessibilityLabel="الرجوع" onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><AppIcon name="chevron-left" size={25} color={palette.text} /></Pressable>
        <Text style={[styles.title, { color: palette.text }]}>المظهر والخلفية</Text><View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: palette.background }]}>
        <Text style={[styles.section, { color: palette.muted }]}>مظهر التطبيق</Text>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          {THEME_OPTIONS.map((option) => <Pressable key={option.value} onPress={() => setThemePreference(option.value)} style={({ pressed }) => [styles.option, { borderBottomColor: palette.border }, pressed && styles.pressed]}><View style={[styles.radio, { borderColor: themePreference === option.value ? palette.primary : palette.muted }]}>{themePreference === option.value ? <View style={[styles.radioDot, { backgroundColor: palette.primary }]} /> : null}</View><View style={styles.copy}><Text style={[styles.optionTitle, { color: palette.text }]}>{option.label}</Text><Text style={[styles.optionDetail, { color: palette.muted }]}>{option.description}</Text></View></Pressable>)}
        </View>
        <Text style={[styles.section, { color: palette.muted }]}>خلفية المحادثة</Text>
        <View style={[styles.customCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={[styles.customPreview, { backgroundColor: palette.background }]}>{chatBackgroundUri ? <Image source={{ uri: chatBackgroundUri }} style={styles.customImage} resizeMode="cover" /> : <Text style={[styles.customEmpty, { color: palette.muted }]}>لم تُختر خلفية مخصصة</Text>}</View>
          <View style={styles.customActions}><Pressable onPress={() => void chooseBackground("gallery")} style={styles.customButton}><AppIcon name="photo-library" size={18} color="#0B5FFF" /><Text style={styles.customButtonText}>من المعرض</Text></Pressable><Pressable onPress={() => void chooseBackground("camera")} style={styles.customButton}><AppIcon name="photo-camera" size={18} color="#0B5FFF" /><Text style={styles.customButtonText}>من الكاميرا</Text></Pressable></View>
        </View>
        <View style={styles.backgroundGrid}>{(Object.entries(CHAT_BACKGROUNDS) as [keyof typeof CHAT_BACKGROUNDS, (typeof CHAT_BACKGROUNDS)[keyof typeof CHAT_BACKGROUNDS]][]).map(([key, item]) => <Pressable key={key} onPress={() => setChatBackground(key)} style={({ pressed }) => [styles.backgroundOption, { backgroundColor: palette.surface, borderColor: chatBackground === key ? palette.primary : palette.border }, chatBackground === key && styles.backgroundSelected, pressed && styles.pressed]}><View style={[styles.swatch, { backgroundColor: colorScheme === "dark" ? item.dark : item.light }]}>{chatBackground === key ? <AppIcon name="done" size={18} color={palette.primary} /> : null}</View><Text style={[styles.backgroundText, { color: palette.text }]}>{item.label}</Text></Pressable>)}</View>
        <Text style={[styles.note, { color: palette.muted }]}>يُحفظ اختيارك على هذا الجهاز ويظهر في شاشة المحادثات.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { height: 64, paddingHorizontal: 16, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1 }, back: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 }, title: { fontSize: 18, fontWeight: "900", writingDirection: "rtl" }, scroll: { flexGrow: 1, padding: 20 }, section: { fontSize: 13, fontWeight: "900", textAlign: "right", writingDirection: "rtl", marginBottom: 8, marginTop: 10 }, card: { borderWidth: 1, borderRadius: 16, overflow: "hidden" }, customCard: { borderWidth: 1, borderRadius: 16, padding: 10, marginBottom: 10 }, customPreview: { height: 90, borderRadius: 11, alignItems: "center", justifyContent: "center", overflow: "hidden" }, customImage: { width: "100%", height: "100%", opacity: 0.75 }, customEmpty: { fontSize: 12, writingDirection: "rtl" }, customActions: { flexDirection: "row-reverse", gap: 8, marginTop: 9 }, customButton: { flex: 1, height: 40, borderRadius: 11, backgroundColor: "#EAF1FF", flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 5 }, customButtonText: { color: "#0B5FFF", fontSize: 12, fontWeight: "800" }, option: { minHeight: 66, paddingHorizontal: 14, flexDirection: "row-reverse", alignItems: "center", gap: 11, borderBottomWidth: 1 }, radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1.5, alignItems: "center", justifyContent: "center" }, radioDot: { width: 11, height: 11, borderRadius: 6 }, copy: { flex: 1 }, optionTitle: { fontSize: 14.5, fontWeight: "800", textAlign: "right", writingDirection: "rtl" }, optionDetail: { fontSize: 11.5, marginTop: 3, textAlign: "right", writingDirection: "rtl" }, backgroundGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10 }, backgroundOption: { width: "47%", borderWidth: 1, borderRadius: 15, padding: 9 }, backgroundSelected: { borderWidth: 2 }, swatch: { height: 72, borderRadius: 10, alignItems: "center", justifyContent: "center" }, backgroundText: { fontSize: 12.5, fontWeight: "800", textAlign: "right", writingDirection: "rtl", marginTop: 7 }, note: { fontSize: 11.5, lineHeight: 18, textAlign: "right", writingDirection: "rtl", marginTop: 15 }, pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
