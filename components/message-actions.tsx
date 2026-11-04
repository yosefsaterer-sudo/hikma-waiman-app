import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { AppIcon, type AppIconName } from "@/components/app-icon";
import { getNativePalette } from "@/lib/native-palette";
import type { ChatMessage } from "@/lib/messenger-models";
import { useThemeContext } from "@/lib/theme-provider";

type MessageAction = {
  icon: AppIconName;
  label: string;
  color?: string;
  destructive?: boolean;
  onPress: () => void;
};

type MessageActionsProps = {
  visible: boolean;
  message: ChatMessage | null;
  isOwnMessage: boolean;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onForward: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onShare: () => void;
  onInfo: () => void;
};

export function MessageActions({
  visible,
  message,
  isOwnMessage,
  onClose,
  onReply,
  onCopy,
  onForward,
  onDeleteForMe,
  onDeleteForEveryone,
  onShare,
  onInfo,
}: MessageActionsProps) {
  const { colorScheme } = useThemeContext();
  const palette = getNativePalette(colorScheme);

  if (!message) return null;

  const actions: MessageAction[] = [
    { icon: "reply", label: "رد", onPress: onReply },
  ];

  if (message.text) {
    actions.push({ icon: "content-copy", label: "نسخ", onPress: onCopy });
  }

  actions.push({ icon: "forward", label: "إعادة توجيه", onPress: onForward });

  if (message.attachments && message.attachments.length > 0) {
    actions.push({ icon: "share", label: "مشاركة", onPress: onShare });
  }

  actions.push({ icon: "info-outline", label: "معلومات", onPress: onInfo });

  actions.push({
    icon: "delete-outline",
    label: "حذف عندي",
    destructive: true,
    onPress: onDeleteForMe,
  });

  if (isOwnMessage) {
    actions.push({
      icon: "delete-forever",
      label: "حذف لدى الجميع",
      destructive: true,
      onPress: onDeleteForEveryone,
    });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          {actions.map((action, index) => (
            <Pressable
              key={`${action.label}-${index}`}
              onPress={() => {
                onClose();
                setTimeout(action.onPress, 100);
              }}
              style={({ pressed }) => [
                styles.action,
                { borderBottomColor: palette.border },
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: action.destructive
                      ? "#FF3B3016"
                      : `${palette.primary}16`,
                  },
                ]}
              >
                <AppIcon
                  name={action.icon}
                  size={20}
                  color={action.destructive ? "#FF3B30" : palette.primary}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: action.destructive ? "#FF3B30" : palette.text,
                  },
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingVertical: 8,
    paddingBottom: 24,
  },
  action: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15.5,
    fontWeight: "700",
    textAlign: "right",
    writingDirection: "rtl",
  },
  pressed: { opacity: 0.6 },
});
