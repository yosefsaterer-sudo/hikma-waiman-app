import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Avatar } from "@/components/avatar";
import { AppIcon, type AppIconName } from "@/components/app-icon";
import { ScreenContainer } from "@/components/screen-container";
import { useMessenger } from "@/lib/messenger-store";
import type { Conversation } from "@/lib/messenger-models";
import { getNativePalette, type NativePalette } from "@/lib/native-palette";
import { useThemeContext } from "@/lib/theme-provider";

export default function ConversationsScreen() {
  const { conversationList, deleteConversation, clearUnread } = useMessenger();
  const { colorScheme } = useThemeContext();
  const palette = getNativePalette(colorScheme);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [actionConversation, setActionConversation] = useState<Conversation | null>(null);

  const filtered = useMemo(
    () => conversationList.filter((item) => (filter === "unread" ? item.unread > 0 : true) && item.name.includes(search.trim())),
    [conversationList, filter, search],
  );

  const handleDelete = () => {
    if (!actionConversation) return;
    Alert.alert(
      "حذف المحادثة",
      `هل أنت متأكد من حذف محادثة "${actionConversation.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: () => {
            deleteConversation(actionConversation.id);
            setActionConversation(null);
          },
        },
      ]
    );
  };

  const handleMarkAsRead = () => {
    if (!actionConversation) return;
    clearUnread(actionConversation.id);
    setActionConversation(null);
  };

  return (
    <ScreenContainer className="bg-background" containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: palette.background }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.kicker, { color: palette.primary, fontFamily: "sans-serif" }]}>حكمة وإيمان</Text>
            <Text style={[styles.title, { color: palette.text }]}>المحادثات</Text>
          </View>
          <View style={[styles.profileCircle, { backgroundColor: palette.primary }]}>
            <Text style={styles.profileText}>أح</Text>
          </View>
        </View>
        <View style={[styles.searchBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <AppIcon name="search" size={21} color={palette.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث في المحادثات"
            placeholderTextColor={palette.muted}
            style={[styles.searchInput, { color: palette.text }]}
            textAlign="right"
          />
        </View>
        <View style={styles.filters}>
          <FilterChip label="الكل" active={filter === "all"} onPress={() => setFilter("all")} palette={palette} />
          <FilterChip label="غير المقروء" active={filter === "unread"} onPress={() => setFilter("unread")} palette={palette} />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { backgroundColor: palette.background }]}
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            palette={palette}
            onLongPress={() => setActionConversation(item)}
          />
        )}
        ListEmptyComponent={<Text style={[styles.empty, { color: palette.muted }]}>لا توجد محادثات مطابقة.</Text>}
      />

      <Pressable
        onPress={() => router.push("/new-chat" as never)}
        style={({ pressed }) => [styles.fab, { backgroundColor: palette.primary }, pressed && styles.pressed]}
        accessibilityLabel="بدء محادثة جديدة"
      >
        <AppIcon name="chat-plus" size={24} color="#138A5B" />
      </Pressable>

      <ConversationActions
        conversation={actionConversation}
        palette={palette}
        onClose={() => setActionConversation(null)}
        onDelete={handleDelete}
        onMarkAsRead={handleMarkAsRead}
      />
    </ScreenContainer>
  );
}

function FilterChip({ label, active, onPress, palette }: { label: string; active: boolean; onPress: () => void; palette: NativePalette }) {
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
      <Text style={[styles.chipText, { color: active ? palette.primary : palette.muted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ConversationRow({ conversation, palette, onLongPress }: { conversation: Conversation; palette: NativePalette; onLongPress: () => void }) {
  return (
    <Pressable
      onPress={() => router.push(`/chat/${conversation.id}` as never)}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [styles.row, { borderBottomColor: palette.border }, pressed && styles.rowPressed]}
    >
      <Avatar initials={conversation.initials} color={conversation.color} imageUri={conversation.avatarUrl} online={conversation.online} />
      <View style={styles.rowCenter}>
        <View style={styles.nameLine}>
          <Text numberOfLines={1} style={[styles.name, { color: palette.text }]}>{conversation.name}</Text>
          {conversation.verified ? <AppIcon name="verified-user" size={16} color="#138A5B" /> : null}
        </View>
        <Text numberOfLines={1} style={[styles.preview, { color: palette.muted }]}>{conversation.lastMessage}</Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={[styles.time, { color: conversation.unread > 0 ? palette.primary : palette.muted }, conversation.unread > 0 && styles.timeUnread]}>{conversation.time}</Text>
        {conversation.unread > 0 ? <View style={[styles.unread, { backgroundColor: palette.primary }]}><Text style={styles.unreadText}>{conversation.unread}</Text></View> : null}
      </View>
    </Pressable>
  );
}

function ConversationActions({
  conversation,
  palette,
  onClose,
  onDelete,
  onMarkAsRead,
}: {
  conversation: Conversation | null;
  palette: NativePalette;
  onClose: () => void;
  onDelete: () => void;
  onMarkAsRead: () => void;
}) {
  if (!conversation) return null;

  return (
    <Modal visible={Boolean(conversation)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.sheetTitle, { color: palette.text }]}>{conversation.name}</Text>

          <Pressable onPress={onMarkAsRead} style={({ pressed }) => [styles.action, { borderBottomColor: palette.border }, pressed && styles.pressed]}>
            <View style={[styles.iconBox, { backgroundColor: `${palette.primary}16` }]}>
              <AppIcon name="done-all" size={20} color={palette.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: palette.text }]}>تعليم كمقروء</Text>
          </Pressable>

          <Pressable onPress={onDelete} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <View style={[styles.iconBox, { backgroundColor: "#FF3B3016" }]}>
              <AppIcon name="delete-outline" size={20} color="#FF3B30" />
            </View>
            <Text style={[styles.actionLabel, { color: "#FF3B30" }]}>حذف المحادثة</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.cancelAction}>
            <Text style={[styles.cancelText, { color: palette.primary }]}>إلغاء</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12 },
  titleRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  kicker: { fontSize: 13, fontWeight: "800", textAlign: "right", letterSpacing: 0.2 },
  title: { fontSize: 31, fontWeight: "800", textAlign: "right", lineHeight: 40 },
  profileCircle: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  profileText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  searchBox: { height: 48, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, flexDirection: "row-reverse", alignItems: "center", gap: 9 },
  searchInput: { flex: 1, fontSize: 15, writingDirection: "rtl" },
  filters: { flexDirection: "row-reverse", gap: 9, marginTop: 14, marginBottom: 10 },
  chip: { minHeight: 34, paddingHorizontal: 14, justifyContent: "center", borderRadius: 18, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  list: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 84 },
  row: { flexDirection: "row-reverse", alignItems: "center", minHeight: 76, gap: 12, borderBottomWidth: 1 },
  rowPressed: { opacity: 0.68 },
  rowCenter: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: "row-reverse", gap: 5, alignItems: "center" },
  name: { fontSize: 16, fontWeight: "800", textAlign: "right", writingDirection: "rtl" },
  preview: { fontSize: 13.5, marginTop: 5, textAlign: "right", writingDirection: "rtl" },
  rowMeta: { alignItems: "flex-end", alignSelf: "stretch", justifyContent: "center", minWidth: 39, gap: 5 },
  time: { fontSize: 11.5, textAlign: "left" },
  timeUnread: { fontWeight: "800" },
  unread: { minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  unreadText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  fab: { position: "absolute", left: 20, bottom: 24, width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", elevation: 6, shadowColor: "#0B5FFF", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  empty: { textAlign: "center", paddingTop: 42, fontSize: 14 },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(4,12,25,0.45)", justifyContent: "flex-end", padding: 14 },
  sheet: { borderRadius: 22, padding: 16, borderWidth: 1 },
  sheetTitle: { fontSize: 16, fontWeight: "800", textAlign: "right", marginBottom: 14, writingDirection: "rtl" },
  action: { flexDirection: "row-reverse", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 15.5, fontWeight: "700", textAlign: "right", writingDirection: "rtl" },
  cancelAction: { minHeight: 46, alignItems: "center", justifyContent: "center", marginTop: 10 },
  cancelText: { fontSize: 15, fontWeight: "900" },
});
