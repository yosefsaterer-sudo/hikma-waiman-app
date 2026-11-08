import { AppIcon } from "@/components/app-icon";
import { canRequestMicrophoneOnWeb, WEB_MICROPHONE_UNAVAILABLE_MESSAGE } from "@/lib/recording-support";
import { getRecordingPermissionsAsync, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

type VoiceNoteRecorderProps = { onRecorded: (uri: string) => void };

export function VoiceNoteRecorder({ onRecorded }: VoiceNoteRecorderProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const [preparing, setPreparing] = useState(false);
  const [statusText, setStatusText] = useState("");

  useEffect(() => { setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true }).catch(() => undefined); }, []);
  const toggleRecording = async () => {
    if (state.isRecording) {
      try {
        await recorder.stop();
        if (recorder.uri) {
          onRecorded(recorder.uri);
          setStatusText("تمت إضافة الرسالة الصوتية");
        } else {
          setStatusText("");
          Alert.alert("لم يُحفظ التسجيل", "حاول تسجيل الرسالة الصوتية مرة أخرى.");
        }
      } catch {
        setStatusText("");
        Alert.alert("تعذر حفظ التسجيل", "حاول إيقاف التسجيل مرة أخرى.");
      }
      return;
    }
    setPreparing(true);
    setStatusText("يتم طلب إذن الميكروفون…");
    try {
      const hasMediaDevices = typeof navigator !== "undefined" && Boolean(navigator.mediaDevices);
      const hasGetUserMedia = hasMediaDevices && typeof navigator.mediaDevices.getUserMedia === "function";
      if (!canRequestMicrophoneOnWeb(Platform.OS, hasMediaDevices, hasGetUserMedia)) {
        setStatusText("");
        Alert.alert("التسجيل غير متاح في هذه المعاينة", WEB_MICROPHONE_UNAVAILABLE_MESSAGE);
        return;
      }
      let permission = await getRecordingPermissionsAsync();
      if (!permission.granted) permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) { setStatusText(""); Alert.alert("إذن الميكروفون", "يلزم السماح بالميكروفون لتسجيل رسالة صوتية. يمكنك تفعيل الإذن من إعدادات المتصفح أو التطبيق."); return; }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      setStatusText("يتم بدء التسجيل…");
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatusText("جارٍ التسجيل — اضغط للإيقاف");
    } catch {
      setStatusText("");
      Alert.alert("تعذر التسجيل", "تعذر بدء التسجيل الصوتي. تحقق من إذن الميكروفون ثم حاول مرة أخرى.");
    } finally { setPreparing(false); }
  };
  const elapsed = Math.floor((state.durationMillis ?? 0) / 1000);
  const elapsedText = `${Math.floor(elapsed / 60).toString().padStart(2, "0")}:${(elapsed % 60).toString().padStart(2, "0")}`;
  return <View style={[styles.wrap, state.isRecording && styles.recordingWrap]}>{state.isRecording ? <Text style={styles.timer}>{elapsedText}</Text> : null}{statusText ? <Text style={[styles.status, state.isRecording && styles.statusRecording]} numberOfLines={1}>{statusText}</Text> : null}<Pressable accessibilityRole="button" accessibilityLabel={state.isRecording ? "إيقاف الرسالة الصوتية" : "بدء رسالة صوتية"} accessibilityState={{ disabled: preparing, selected: state.isRecording }} disabled={preparing} onPress={toggleRecording} style={({ pressed }) => [styles.button, state.isRecording && styles.recording, (pressed || preparing) && styles.pressed]}>{preparing ? <AppIcon name="hourglass-empty" size={19} color="#0B5FFF" /> : <AppIcon name={state.isRecording ? "stop" : "mic-none"} size={20} color={state.isRecording ? "#FFFFFF" : "#0B5FFF"} />}{state.isRecording ? <Text style={styles.stopLabel}>إيقاف</Text> : null}</Pressable></View>;
}

const styles = StyleSheet.create({ wrap: { flexDirection: "row-reverse", alignItems: "center", gap: 7, flex: 1, justifyContent: "flex-start", minWidth: 40 }, recordingWrap: { justifyContent: "flex-end" }, button: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF1FF", flexDirection: "row-reverse", gap: 3, paddingHorizontal: 0, overflow: "hidden" }, recording: { width: 88, backgroundColor: "#C83D4B", borderRadius: 21, paddingHorizontal: 10 }, stopLabel: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", writingDirection: "rtl" }, timer: { color: "#C83D4B", fontSize: 12, fontWeight: "900" }, status: { flexShrink: 1, color: "#62718A", fontSize: 10.5, writingDirection: "rtl", textAlign: "right" }, statusRecording: { color: "#C83D4B", fontWeight: "800" }, pressed: { opacity: 0.72, transform: [{ scale: 0.94 }] } });
