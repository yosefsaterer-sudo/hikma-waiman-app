export function canRequestMicrophoneOnWeb(
  platform: string,
  hasMediaDevices: boolean,
  hasGetUserMedia: boolean,
) {
  return platform !== "web" || (hasMediaDevices && hasGetUserMedia);
}

export const WEB_MICROPHONE_UNAVAILABLE_MESSAGE =
  "جرّب الرسائل الصوتية من Expo Go أو من نسخة Android؛ بعض إطارات المعاينة لا تمنح الوصول إلى الميكروفون.";
