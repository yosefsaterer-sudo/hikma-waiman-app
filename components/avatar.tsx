import { Image, StyleSheet, Text, View } from "react-native";

type AvatarProps = {
  initials: string;
  color: string;
  size?: number;
  online?: boolean;
  imageUri?: string;
};

export function Avatar({ initials, color, size = 48, online = false, imageUri }: AvatarProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      {imageUri ? <Image source={{ uri: imageUri }} style={{ width: size, height: size, borderRadius: size / 2 }} /> : <Text style={[styles.initials, { fontSize: size * 0.33 }]}>{initials}</Text>}
      {online ? <View style={styles.online} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", position: "relative" },
  initials: { color: "#FFFFFF", fontWeight: "800", textAlign: "center" },
  online: { position: "absolute", width: 13, height: 13, borderRadius: 7, backgroundColor: "#23B277", borderWidth: 2, borderColor: "#FFFFFF", bottom: 0, left: 0 },
});
