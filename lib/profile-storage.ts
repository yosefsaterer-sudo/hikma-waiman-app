import AsyncStorage from "@react-native-async-storage/async-storage";

import { copyToManagedDirectory, managedFile } from "@/lib/media-cache";

const PROFILE_URI_KEY = "messenger.profile.avatar-uri";
const PROFILE_FILENAME = "avatar.jpg";

export async function getProfileAvatar() {
  const stored = await AsyncStorage.getItem(PROFILE_URI_KEY);
  if (!stored) return null;
  const file = managedFile("profile", PROFILE_FILENAME);
  return file.exists ? file.uri : null;
}

export async function setProfileAvatar(uri: string) {
  const localUri = await copyToManagedDirectory(uri, "profile", PROFILE_FILENAME);
  await AsyncStorage.setItem(PROFILE_URI_KEY, localUri);
  return localUri;
}

export async function clearProfileAvatar() {
  const file = managedFile("profile", PROFILE_FILENAME);
  if (file.exists) file.delete();
  await AsyncStorage.removeItem(PROFILE_URI_KEY);
}
