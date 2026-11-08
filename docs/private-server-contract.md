# عقد الخادم الخاص لمراسل آمن

## الغرض

يوضح هذا المستند الواجهات التي يحتاجها الخادم الخاص لتمكين الرسائل، الوسائط، التحديثات الفورية، وإشارات المكالمات. يبقى **وضع الزائر** محليًا بالكامل ولا يستدعي أيًا من هذه المسارات.

## المصادقة

يجب أن يقبل الخادم رمز وصول قصير العمر في ترويسة `Authorization` بالصيغة `Bearer <token>`. تحفظ واجهة التطبيق الرمز في التخزين الآمن على الجهاز. يلزم رفض الاتصالات غير المشفرة؛ تستخدم جميع مسارات REST بروتوكول `HTTPS`، وتستخدم قناة التحديثات بروتوكول `WSS`.

## واجهات REST

| العملية | المسار الافتراضي | الطلب | الاستجابة المتوقعة |
|---|---|---|---|
| فحص الخادم | `GET /health` | — | `{ "status": "ok" }` |
| جلب المحادثات | `GET /v1/conversations` | — | قائمة المحادثات مع آخر رسالة وحالة القراءة |
| جلب الرسائل | `GET /v1/conversations/:id/messages?cursor=` | — | `{ "items": [], "nextCursor": "" }` |
| إرسال رسالة | `POST /v1/conversations/:id/messages` | `{ "text": "", "mediaIds": [] }` | الرسالة المنشأة مع معرّفها ووقتها |
| رفع وسيط | `POST /v1/media` | `multipart/form-data` بالحقل `file` | `{ "mediaId": "...", "url": "https://...", "mimeType": "...", "size": 0 }` |
| حذف رسالة للجميع | `DELETE /v1/messages/:id` | — | `{ "success": true, "deletedForEveryone": true }` |
| تسجيل قراءة | `POST /v1/messages/:id/read` | — | `{ "success": true }` |
| جلب الملف الشخصي | `GET /v1/auth/profile` | — | `{ "profile": { "avatarUrl": null, "backgroundUrl": null } }` |
| رفع صورة الحساب أو الخلفية | `POST /v1/auth/profile/media` | `multipart/form-data`: `file` و`kind=avatar|background` | `{ "kind": "avatar", "url": "..." }` |
| استلام بيانات ICE | `GET /v1/calls/ice` | — | `{ "iceServers": [{ "urls": ["stun:...", "turns:..."], "username": "", "credential": "" }] }` |

## قناة WebSocket

يتصل التطبيق إلى `WSS /v1/realtime?access_token=<token>` بعد اعتماد الخادم. تستخدم الرسائل بنية موحدة:

```json
{
  "type": "message.created",
  "conversationId": "team",
  "payload": {}
}
```

| النوع | اتجاه الحدث | الاستخدام |
|---|---|---|
| `message.created` | الخادم ← التطبيق | إضافة رسالة جديدة وتحديث غير المقروء |
| `message.read` | التطبيق ↔ الخادم | مزامنة حالة القراءة |
| `media.ready` | الخادم ← التطبيق | استبدال رابط الرفع المؤقت بالرابط المعتمد |
| `call.offer` | التطبيق ↔ الخادم | تمرير عرض WebRTC إلى الطرف الآخر |
| `call.answer` | التطبيق ↔ الخادم | تمرير جواب WebRTC |
| `call.ice-candidate` | التطبيق ↔ الخادم | تمرير مرشح اتصال ICE |
| `call.ended` | التطبيق ↔ الخادم | إنهاء المكالمة وتنظيف الحالة |

## المكالمات

يدير الخادم **الإشارات فقط** ولا يمرر صوتًا أو فيديو. يتولى WebRTC الاتصال الإعلامي بين الجهازين باستخدام خوادم STUN/TURN صالحة. يلزم خادم TURN فعلي للمستخدمين خلف شبكات مقيدة؛ لا يكفي STUN وحده لتوفير اتصال موثوق.

يعتمد بناء Android على `react-native-webrtc` وإضافة الإعداد الموافقة لإصدار Expo SDK 54: `react-native-webrtc@124.0.6` و`@config-plugins/react-native-webrtc@13.0.0`. لا تعمل هذه الطبقة داخل Expo Go، بل تتطلب بناء Android مخصصًا، وهو ما يوفره مسار النشر في المشروع.

## مراجع البناء

- [react-native-webrtc: متطلبات Expo والبناء المخصص](https://github.com/react-native-webrtc/react-native-webrtc)
- [إضافة تهيئة react-native-webrtc المتوافقة مع Expo SDK 54](https://www.npmjs.com/package/@config-plugins/react-native-webrtc)
