import * as DocumentPicker from "expo-document-picker";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import { VideoView, useVideoPlayer } from "expo-video";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Easing, FlatList, Image, ImageBackground, KeyboardAvoidingView, Modal, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";

import { Avatar } from "@/components/avatar";
import { MessageActions } from "@/components/message-actions";
import * as Clipboard from "expo-clipboard";
import { AppIcon, type AppIconName } from "@/components/app-icon";
import { ScreenContainer } from "@/components/screen-container";
import { VoiceNoteRecorder } from "@/components/voice-note-recorder";
import { saveIncomingAttachment } from "@/lib/attachment-storage";
import { CHAT_BACKGROUNDS } from "@/lib/chat-appearance";
import { createMediaAttachment, formatFileSize, formatTransferProgress } from "@/lib/media-utils";
import { useMessenger } from "@/lib/messenger-store";
import type { ChatMessage, MediaAttachment } from "@/lib/messenger-models";
import { getNativePalette, type NativePalette } from "@/lib/native-palette";
import { useThemeContext } from "@/lib/theme-provider";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { conversationList, messagesByConversation, sendMessage, sendAttachments, clearUnread, deleteMessage, forwardMessage, markConversationRead } = useMessenger();
  const { chatBackground, chatBackgroundUri, colorScheme } = useThemeContext();
  const palette = getNativePalette(colorScheme);
  const chatColor = CHAT_BACKGROUNDS[chatBackground][colorScheme];
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage["replyTo"]>();
  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenOffset = useRef(new Animated.Value(14)).current;
  const conversation = useMemo(() => conversationList.find((item) => item.id === id), [conversationList, id]);
  const messages = messagesByConversation[id] ?? [];
  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenOpacity, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(screenOffset, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [screenOffset, screenOpacity]);
  useEffect(() => { if (id) { clearUnread(id); void markConversationRead(id); } }, [clearUnread, id, markConversationRead]);
  useEffect(() => { setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50); }, [messages.length]);

  if (!conversation) return null;
  const onSend = () => { sendMessage(conversation.id, draft, replyTo); setDraft(""); setReplyTo(undefined); };
  const sendPickedAttachments = (attachments: MediaAttachment[]) => {
    if (!attachments.length) return;
    sendAttachments(conversation.id, attachments, draft);
    setDraft("");
    setAttachmentsOpen(false);
  };
  const pickGallery = async () => {
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsMultipleSelection: true, selectionLimit: 5, quality: 0.8 });
      if (!result.canceled) sendPickedAttachments(result.assets.map((asset) => createMediaAttachment({ uri: asset.uri, name: asset.fileName ?? (asset.type === "video" ? "فيديو.mp4" : "صورة.jpg"), mimeType: asset.mimeType ?? (asset.type === "video" ? "video/mp4" : "image/jpeg"), size: asset.fileSize })));
    } catch { Alert.alert("تعذر فتح المعرض", "تحقق من سماح التطبيق بالوصول إلى الوسائط."); } finally { setPicking(false); }
  };
  const takeMedia = async () => {
    setPicking(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") { Alert.alert("إذن الكاميرا", "يلزم السماح بالكاميرا لالتقاط صورة أو فيديو."); return; }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
      if (!result.canceled) sendPickedAttachments(result.assets.map((asset) => createMediaAttachment({ uri: asset.uri, name: asset.fileName ?? (asset.type === "video" ? "فيديو.mp4" : "صورة.jpg"), mimeType: asset.mimeType ?? (asset.type === "video" ? "video/mp4" : "image/jpeg"), size: asset.fileSize })));
    } catch { Alert.alert("تعذر تشغيل الكاميرا", "حاول مرة أخرى بعد التحقق من أذونات الكاميرا."); } finally { setPicking(false); }
  };
  const pickFiles = async () => {
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*", multiple: true, copyToCacheDirectory: true });
      if (!result.canceled) sendPickedAttachments(result.assets.map((asset) => createMediaAttachment({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? "application/octet-stream", size: asset.size })));
    } catch { Alert.alert("تعذر اختيار الملف", "حاول اختيار الملف مرة أخرى."); } finally { setPicking(false); }
  };
  const sendVoiceNote = (uri: string) => sendPickedAttachments([createMediaAttachment({ uri, name: "رسالة-صوتية.m4a", mimeType: "audio/m4a" })]);

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="bg-background" containerClassName="bg-background">
      <Animated.View style={[styles.flex, { opacity: screenOpacity, transform: [{ translateY: screenOffset }] }]}>
      <KeyboardAvoidingView style={[styles.flex, { backgroundColor: chatColor }]} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
        {chatBackground === "custom" && chatBackgroundUri ? <ImageBackground source={{ uri: chatBackgroundUri }} style={StyleSheet.absoluteFillObject} imageStyle={{ opacity: 0.22 }} /> : null}
        <View style={[styles.topBar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><AppIcon name="arrow-forward" size={24} color={palette.text} /></Pressable>
          <Pressable onPress={() => Alert.alert("حالة الأمان", "هذه المحادثة معروضة ببيانات تجريبية. عند ربط الخادم، ستعكس الشارة حالة التشفير الفعلية.")} style={({ pressed }) => [styles.person, pressed && styles.pressed]}>
            <Avatar initials={conversation.initials} color={conversation.color} imageUri={conversation.avatarUrl} size={38} online={conversation.online} />
            <View style={styles.personCopy}><Text style={[styles.personName, { color: palette.text }]}>{conversation.name}</Text><View style={styles.securityLine}><AppIcon name="verified-user" size={14} color="#138A5B" /><Text style={styles.securityText}>جلسة محمية</Text></View></View>
          </Pressable>
          <View style={styles.callActions} />
        </View>
        <View style={[styles.notice, { backgroundColor: palette.notice }]}><AppIcon name="lock-outline" size={15} color="#138A5B" /><Text style={[styles.noticeText, { color: palette.noticeText }]}>تحقّق من الهوية عند تفعيل الخادم الخاص.</Text></View>
        <FlatList style={{ backgroundColor: "transparent" }} ref={listRef} data={messages} keyExtractor={(item) => item.id} renderItem={({ item }) => <MessageBubble message={item} conversationId={conversation.id} palette={palette} onLongPress={() => setActionMessage(item)} />} contentContainerStyle={styles.messageList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" />
        {attachmentsOpen ? <View style={styles.attachmentTray}>
          <AttachmentAction icon="photo-library" label="الصور والفيديو" onPress={pickGallery} disabled={picking} />
          <AttachmentAction icon="photo-camera" label="التقاط" onPress={takeMedia} disabled={picking} />
          <AttachmentAction icon="attach-file" label="ملف" onPress={pickFiles} disabled={picking} />
          {picking ? <View style={styles.picking}><ActivityIndicator size="small" color="#0B5FFF" /><Text style={styles.pickingText}>جارٍ تجهيز المرفق…</Text></View> : null}
        </View> : null}
        <View style={[styles.composer, { backgroundColor: palette.surface, borderTopColor: palette.border }]}>
          {replyTo ? <View style={[styles.replyBar, { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}><View style={styles.replyCopy}><Text style={[styles.replyLabel, { color: palette.primary }]}>رد على رسالة</Text><Text numberOfLines={1} style={[styles.replyText, { color: palette.text }]}>{replyTo.text || "مرفق"}</Text></View><Pressable onPress={() => setReplyTo(undefined)} style={styles.replyClose}><AppIcon name="close" size={17} color={palette.muted} /></Pressable></View> : null}
          <Pressable onPress={() => setAttachmentsOpen((value) => !value)} style={({ pressed }) => [styles.addButton, attachmentsOpen && styles.addButtonActive, pressed && styles.pressed]}><AppIcon name={attachmentsOpen ? "close" : "add"} size={23} color="#0B5FFF" /></Pressable>
          <TextInput value={draft} onChangeText={setDraft} onFocus={() => requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))} placeholder="اكتب رسالة" placeholderTextColor={palette.muted} multiline maxLength={1000} style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} textAlign="right" textAlignVertical="center" />
          {draft.trim() ? <Pressable onPress={onSend} style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]}><AppIcon name="send" size={20} color="#FFFFFF" /></Pressable> : <VoiceNoteRecorder onRecorded={sendVoiceNote} />}
        </View>
      </KeyboardAvoidingView>
      </Animated.View>
      <MessageActions
        visible={Boolean(actionMessage)}
        message={actionMessage}
        isOwnMessage={Boolean(actionMessage?.outgoing)}
        onClose={() => setActionMessage(null)}
        onReply={() => { if (!actionMessage) return; setReplyTo({ id: actionMessage.id, text: actionMessage.text, outgoing: actionMessage.outgoing }); }}
        onCopy={() => { if (actionMessage?.text) void Clipboard.setStringAsync(actionMessage.text); }}
        onForward={() => { if (!actionMessage) return; const targets = conversationList.filter((item) => item.id !== conversation.id).slice(0, 3); if (!targets.length) { Alert.alert("إعادة التوجيه", "أنشئ محادثة أخرى أولًا."); return; } Alert.alert("إعادة التوجيه إلى", "اختر المحادثة", targets.map((target) => ({ text: target.name, onPress: () => void forwardMessage(target.id, actionMessage).catch(() => Alert.alert("تعذر إعادة التوجيه", "تحقق من الاتصال بالخادم.")) }))); }}
        onDeleteForMe={() => { if (actionMessage) void deleteMessage(conversation.id, actionMessage.id).catch((error) => Alert.alert("تعذر الحذف", error instanceof Error ? error.message : "حاول مرة أخرى.")); }}
        onDeleteForEveryone={() => { if (actionMessage) void deleteMessage(conversation.id, actionMessage.id, true).catch((error) => Alert.alert("تعذر الحذف لدى الجميع", error instanceof Error ? error.message : "تحقق من الخادم.")); }}
        onShare={async () => { if (actionMessage) await Share.share({ message: actionMessage.text || "مرفق من حكمة وإيمان" }); }}
        onInfo={() => Alert.alert("معلومات الرسالة", actionMessage ? `${actionMessage.time}
${actionMessage.outgoing ? "رسالة صادرة" : "رسالة واردة"}` : "")}
      />
    </ScreenContainer>
  );
}

function MessageBubble({ message, conversationId, palette, onLongPress }: { message: ChatMessage; conversationId: string; palette: NativePalette; onLongPress: () => void }) {
  const { retryAttachment } = useMessenger();
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const messageOffset = useRef(new Animated.Value(8)).current;
  useEffect(() => { Animated.parallel([Animated.timing(messageOpacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }), Animated.timing(messageOffset, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true })]).start(); }, [messageOffset, messageOpacity]);
  return <Animated.View style={[styles.messageWrap, message.outgoing ? styles.outgoingWrap : styles.incomingWrap, { opacity: messageOpacity, transform: [{ translateY: messageOffset }] }]}><Pressable delayLongPress={350} onLongPress={onLongPress} style={[styles.bubble, message.outgoing ? styles.outgoingBubble : [styles.incomingBubble, { backgroundColor: palette.surface, borderColor: palette.border }]]}>{message.replyTo ? <View style={[styles.replyPreview, { backgroundColor: message.outgoing ? "rgba(255,255,255,0.14)" : palette.surfaceRaised }]}><Text numberOfLines={1} style={[styles.replyPreviewText, { color: message.outgoing ? "#FFFFFF" : palette.muted }]}>{message.replyTo.text || "مرفق"}</Text></View> : null}{message.attachments?.map((attachment) => <AttachmentPreview key={attachment.id} attachment={attachment} outgoing={message.outgoing} onRetry={() => retryAttachment(conversationId, attachment.id)} />)}{message.text ? <Text style={[styles.messageText, { color: palette.text }, message.outgoing && styles.outgoingText, message.deleted && styles.deletedText]}>{message.text}</Text> : null}<View style={styles.messageMeta}><Text style={[styles.messageTime, { color: palette.muted }, message.outgoing && styles.outgoingTime]}>{message.time}</Text>{message.outgoing ? <AppIcon name={message.status === "read" ? "done-all" : "done"} size={14} color="#BFD4FF" /> : null}</View></Pressable></Animated.View>;
}

function MessageActionSheet({ message, onClose, onReply, onDelete, onForward }: { message: ChatMessage | null; onClose: () => void; onReply: (message: ChatMessage) => void; onDelete: (message: ChatMessage) => void; onForward: (message: ChatMessage) => void }) {
  const share = async () => { if (!message) return; try { await Share.share({ message: message.text || "مرفق من حكمة وإيمان" }); } finally { onClose(); } };
  return <Modal visible={Boolean(message)} transparent animationType="fade" onRequestClose={onClose}><Pressable style={styles.sheetBackdrop} onPress={onClose}><Pressable style={styles.actionSheet} onPress={() => undefined}><Text numberOfLines={2} style={styles.actionPreview}>{message?.text || "مرفق"}</Text><ActionButton icon="reply" label="رد" onPress={() => message && onReply(message)} /><ActionButton icon="forward" label="إعادة توجيه" onPress={() => message && onForward(message)} /><ActionButton icon="share" label="مشاركة" onPress={share} /><ActionButton icon="delete" label={message?.outgoing ? "حذف لدى الجميع" : "حذف من جهازي"} danger onPress={() => message && onDelete(message)} /><Pressable onPress={onClose} style={styles.cancelAction}><Text style={styles.cancelText}>إلغاء</Text></Pressable></Pressable></Pressable></Modal>;
}

function ActionButton({ icon, label, danger, onPress }: { icon: AppIconName; label: string; danger?: boolean; onPress: () => void }) {
  const color = danger ? "#C83D4B" : "#10233F";
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}><AppIcon name={icon} size={20} color={color} /><Text style={[styles.actionText, danger && styles.dangerText]}>{label}</Text></Pressable>;
}

function AttachmentAction({ icon, label, onPress, disabled }: { icon: AppIconName; label: string; onPress: () => void; disabled: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.attachmentAction, (pressed || disabled) && styles.pressed]}><View style={styles.attachmentIcon}><AppIcon name={icon} size={21} color="#0B5FFF" /></View><Text style={styles.attachmentLabel}>{label}</Text></Pressable>;
}

function AttachmentPreview({ attachment, outgoing, onRetry }: { attachment: MediaAttachment; outgoing: boolean; onRetry: () => void }) {
  const [saving, setSaving] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const attachmentOpacity = useRef(new Animated.Value(0)).current;
  const attachmentOffset = useRef(new Animated.Value(6)).current;
  useEffect(() => { Animated.parallel([Animated.timing(attachmentOpacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }), Animated.timing(attachmentOffset, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true })]).start(); }, [attachmentOffset, attachmentOpacity]);
  const icon: Record<MediaAttachment["kind"], AppIconName> = { image: "image", video: "play-circle-filled", audio: "audiotrack", file: "insert-drive-file" };
  const isImage = attachment.kind === "image" && Boolean(attachment.uri);
  const save = async () => { setSaving(true); const result = await saveIncomingAttachment(attachment); setSaving(false); Alert.alert(result.ok ? "تم الحفظ" : "تعذر الحفظ", result.message); };
  return <Animated.View style={[styles.attachmentPreview, { opacity: attachmentOpacity, transform: [{ translateY: attachmentOffset }] }]}>{isImage ? <View><Image source={{ uri: attachment.uri }} onLoad={() => setImageReady(true)} style={styles.imagePreview} resizeMode="cover" />{!imageReady ? <View style={styles.mediaLoading}><ActivityIndicator size="small" color="#0B5FFF" /><Text style={styles.mediaLoadingText}>جارٍ تحميل الصورة…</Text></View> : null}</View> : attachment.kind === "video" ? <VideoAttachment attachment={attachment} /> : attachment.kind === "audio" ? <AudioAttachment attachment={attachment} outgoing={outgoing} /> : <View style={[styles.filePreview, outgoing && styles.filePreviewOutgoing]}><View style={[styles.fileIcon, outgoing && styles.fileIconOutgoing]}><AppIcon name={icon[attachment.kind]} size={25} color={outgoing ? "#FFFFFF" : "#0B5FFF"} /></View><View style={styles.fileCopy}><Text numberOfLines={1} style={[styles.fileName, outgoing && styles.outgoingText]}>{attachment.name}</Text><Text style={[styles.fileMeta, outgoing && styles.outgoingMeta]}>{formatFileSize(attachment.size)}</Text></View></View>}{!outgoing && attachment.transferState === "received" ? <Pressable disabled={saving} onPress={save} style={({ pressed }) => [styles.saveAttachment, (pressed || saving) && styles.pressed]}><AppIcon name="insert-drive-file" size={15} color="#0B5FFF" /><Text style={styles.saveAttachmentText}>{saving ? "جارٍ الحفظ…" : "حفظ"}</Text></Pressable> : null}{attachment.transferState === "sending" || attachment.transferState === "preparing" ? <View style={styles.transferOverlay}><ActivityIndicator size="small" color="#FFFFFF" /><Text style={styles.transferText}>جارٍ الإرسال {formatTransferProgress(attachment.progress)}</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${attachment.progress ?? 0}%` }]} /></View></View> : null}{attachment.transferState === "failed" ? <Pressable onPress={onRetry} style={styles.failedLabel}><AppIcon name="refresh" size={14} color="#C83D4B" /><Text style={styles.failedText}>أعد المحاولة</Text></Pressable> : null}</Animated.View>;
}

function AudioAttachment({ attachment, outgoing }: { attachment: MediaAttachment; outgoing: boolean }) {
  const player = useAudioPlayer(attachment.uri);
  const status = useAudioPlayerStatus(player);
  useEffect(() => { setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined); }, []);
  const togglePlayback = () => { if (status.playing) player.pause(); else player.play(); };
  return <Pressable onPress={togglePlayback} style={[styles.audioPreview, outgoing && styles.filePreviewOutgoing]}><View style={[styles.fileIcon, outgoing && styles.fileIconOutgoing]}><AppIcon name={status.playing ? "pause" : "play-arrow"} size={25} color={outgoing ? "#FFFFFF" : "#0B5FFF"} /></View><View style={styles.fileCopy}><Text numberOfLines={1} style={[styles.fileName, outgoing && styles.outgoingText]}>{attachment.name}</Text><View style={styles.audioLine}><View style={[styles.audioProgress, outgoing && styles.audioProgressOutgoing, { width: `${status.duration > 0 ? (status.currentTime / status.duration) * 100 : 0}%` }]} /></View><Text style={[styles.fileMeta, outgoing && styles.outgoingMeta]}>{status.playing ? "قيد التشغيل" : formatFileSize(attachment.size)}</Text></View></Pressable>;
}

function VideoAttachment({ attachment }: { attachment: MediaAttachment }) {
  const player = useVideoPlayer(attachment.uri, (videoPlayer) => { videoPlayer.loop = false; });
  return <View style={styles.videoPreview}><VideoView style={styles.videoView} player={player} nativeControls allowsFullscreen allowsPictureInPicture contentFit="cover" surfaceType="textureView" /><View style={styles.videoCaption}><AppIcon name="movie" size={15} color="#FFFFFF" /><Text numberOfLines={1} style={styles.videoCaptionText}>{attachment.name}</Text></View></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F7F9FE" },
  topBar: { height: 66, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E2E9F3", paddingHorizontal: 14, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  iconButton: { height: 40, width: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }, callActions: { flexDirection: "row-reverse", gap: 2 }, miniIconButton: { width: 34, height: 40, alignItems: "center", justifyContent: "center" },
  person: { flexDirection: "row-reverse", alignItems: "center", gap: 9, flex: 1, justifyContent: "center" },
  personCopy: { alignItems: "flex-start" },
  personName: { color: "#10233F", fontSize: 15.5, fontWeight: "800", writingDirection: "rtl", textAlign: "right" },
  securityLine: { flexDirection: "row-reverse", gap: 3, alignItems: "center", marginTop: 2 },
  securityText: { color: "#138A5B", fontSize: 11.5, fontWeight: "700" },
  notice: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, backgroundColor: "#EAF6F0" },
  noticeText: { color: "#267153", fontSize: 11.5, writingDirection: "rtl" },
  messageList: { paddingHorizontal: 16, paddingVertical: 18, gap: 8, flexGrow: 1 },
  messageWrap: { width: "100%", marginVertical: 3 },
  outgoingWrap: { alignItems: "flex-start" },
  incomingWrap: { alignItems: "flex-end" },
  bubble: { maxWidth: "82%", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18 },
  outgoingBubble: { backgroundColor: "#0B5FFF", borderBottomLeftRadius: 5 },
  incomingBubble: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E0E7F1", borderBottomRightRadius: 5 },
  messageText: { color: "#10233F", fontSize: 15, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  outgoingText: { color: "#FFFFFF" },
  messageMeta: { flexDirection: "row-reverse", alignItems: "center", alignSelf: "flex-start", gap: 4, marginTop: 5 },
  messageTime: { color: "#8090A8", fontSize: 10.5 },
  outgoingTime: { color: "#D6E3FF" },
  attachmentTray: { backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#E0E7F1", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10, flexDirection: "row-reverse", gap: 18, alignItems: "flex-start" },
  attachmentAction: { alignItems: "center", gap: 5, minWidth: 62 }, attachmentIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#EAF1FF", alignItems: "center", justifyContent: "center" }, attachmentLabel: { color: "#41526D", fontSize: 11.5, fontWeight: "700", textAlign: "center", writingDirection: "rtl" }, picking: { flex: 1, flexDirection: "row-reverse", alignItems: "center", justifyContent: "flex-end", gap: 5, paddingTop: 10 }, pickingText: { color: "#0B5FFF", fontSize: 11.5, writingDirection: "rtl" },
  composer: { minHeight: 66, borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 9, flexDirection: "row-reverse", alignItems: "center", gap: 8, flexWrap: "wrap" },
  addButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#EAF1FF", alignItems: "center", justifyContent: "center" },
  addButtonActive: { backgroundColor: "#D8E5FF" },
  input: { flex: 1, minHeight: 40, maxHeight: 94, backgroundColor: "#F3F6FB", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, color: "#10233F", fontSize: 15, writingDirection: "rtl" },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#0B5FFF" },
  sendDisabled: { backgroundColor: "#AFC3EC" },
  replyBar: { width: "100%", flexDirection: "row-reverse", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 1 }, replyCopy: { flex: 1 }, replyLabel: { fontSize: 10.5, fontWeight: "900", textAlign: "right", writingDirection: "rtl" }, replyText: { fontSize: 11.5, marginTop: 2, textAlign: "right", writingDirection: "rtl" }, replyClose: { width: 30, height: 30, alignItems: "center", justifyContent: "center" }, replyPreview: { borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 7 }, replyPreviewText: { fontSize: 11.5, textAlign: "right", writingDirection: "rtl" }, deletedText: { fontStyle: "italic", opacity: 0.74 },
  attachmentPreview: { marginBottom: 8, position: "relative", overflow: "hidden", borderRadius: 12 }, imagePreview: { width: 210, height: 150, borderRadius: 12, backgroundColor: "#DCE7F8" }, mediaLoading: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.62)" }, mediaLoadingText: { color: "#0B5FFF", fontSize: 11, fontWeight: "800", writingDirection: "rtl" }, saveAttachment: { marginTop: 5, alignSelf: "flex-end", flexDirection: "row-reverse", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, backgroundColor: "#EAF1FF" }, saveAttachmentText: { color: "#0B5FFF", fontSize: 11, fontWeight: "800", writingDirection: "rtl" },
  filePreview: { minWidth: 210, maxWidth: 240, minHeight: 64, borderRadius: 12, padding: 10, flexDirection: "row-reverse", alignItems: "center", gap: 9, backgroundColor: "#EDF3FE" }, filePreviewOutgoing: { backgroundColor: "#216BFF" }, fileIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }, fileIconOutgoing: { backgroundColor: "#4E87FF" }, fileCopy: { flex: 1, minWidth: 0 }, fileName: { color: "#10233F", fontSize: 12.5, fontWeight: "800", textAlign: "right", writingDirection: "rtl" }, fileMeta: { color: "#63738E", fontSize: 11, marginTop: 4, textAlign: "right" }, outgoingMeta: { color: "#D6E3FF" }, transferOverlay: { position: "absolute", inset: 0, backgroundColor: "rgba(16,35,63,0.58)", alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 18 }, transferText: { color: "#FFFFFF", fontSize: 11.5, fontWeight: "800", writingDirection: "rtl" }, progressTrack: { width: 140, height: 4, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.35)", overflow: "hidden" }, progressFill: { height: "100%", backgroundColor: "#FFFFFF", borderRadius: 3 }, failedLabel: { flexDirection: "row-reverse", gap: 3, alignItems: "center", marginTop: 5, alignSelf: "flex-start" }, failedText: { color: "#C83D4B", fontSize: 11, fontWeight: "700" }, audioPreview: { minWidth: 210, maxWidth: 240, minHeight: 64, borderRadius: 12, padding: 10, flexDirection: "row-reverse", alignItems: "center", gap: 9, backgroundColor: "#EDF3FE" }, audioLine: { height: 3, borderRadius: 2, overflow: "hidden", backgroundColor: "#C9D8EF", marginTop: 6 }, audioProgress: { height: "100%", backgroundColor: "#0B5FFF" }, audioProgressOutgoing: { backgroundColor: "#FFFFFF" }, videoPreview: { width: 220, height: 144, borderRadius: 12, overflow: "hidden", backgroundColor: "#10233F" }, videoView: { width: "100%", height: "100%" }, videoCaption: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row-reverse", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: "rgba(16,35,63,0.62)" }, videoCaptionText: { flex: 1, color: "#FFFFFF", fontSize: 10.5, fontWeight: "700", textAlign: "right", writingDirection: "rtl" },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(4,12,25,0.45)", justifyContent: "flex-end", padding: 14 }, actionSheet: { backgroundColor: "#FFFFFF", borderRadius: 22, padding: 14 }, actionPreview: { color: "#68758A", textAlign: "right", writingDirection: "rtl", paddingHorizontal: 8, paddingVertical: 5, fontSize: 12.5 }, actionButton: { minHeight: 48, flexDirection: "row-reverse", alignItems: "center", gap: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#EEF2F8" }, actionText: { color: "#10233F", fontSize: 15, fontWeight: "800", writingDirection: "rtl" }, dangerText: { color: "#C83D4B" }, cancelAction: { minHeight: 46, alignItems: "center", justifyContent: "center", marginTop: 7, backgroundColor: "#EDF3FE", borderRadius: 13 }, cancelText: { color: "#0B5FFF", fontSize: 15, fontWeight: "900" },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
});
