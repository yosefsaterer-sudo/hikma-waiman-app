import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";

import { messengerAccounts, messengerConversationMembers, messengerConversations, messengerMedia, messengerMessageReads, messengerMessages, messengerPushTokens, messengerSessions } from "../drizzle/schema";
import { getDb } from "./db";
import { storagePut } from "./storage";

const scryptAsync = promisify(scrypt);
const SESSION_DAYS = 30;
const MAX_MEDIA_BYTES = 100 * 1024 * 1024;

export type TrialMedia = {
  mediaId: string;
  url: string;
  mimeType: string;
  size: number;
  name: string;
};

type AccountRecord = { id: string; username: string; passwordHash: string; recoveryHash: string };

function normalizeUsername(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidUsername(username: string) {
  return /^[\p{L}\p{N}_-]{3,32}$/u.test(username);
}

export function isValidPassword(password: unknown) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}

async function hashSecret(secret: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(secret, salt, 64) as Buffer;
  return `${salt}.${derived.toString("hex")}`;
}

async function matchesSecret(secret: string, stored: string) {
  const [salt, encoded] = stored.split(".");
  if (!salt || !encoded) return false;
  const derived = await scryptAsync(secret, salt, 64) as Buffer;
  const expected = Buffer.from(encoded, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function createRecoveryCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(20);
  const characters = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return characters.match(/.{1,4}/g)?.join("-") ?? characters;
}

function createSessionToken() {
  return randomBytes(36).toString("base64url");
}

function tokenHash(token: string) {
  return createHash("sha512").update(token).digest("hex");
}

async function issueSession(accountId: string) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة بيانات الخادم غير متاحة.");
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(messengerSessions).values({ tokenHash: tokenHash(token), accountId, expiresAt });
  return { token, expiresAt };
}

async function findAuthenticatedAccount(req: Request): Promise<AccountRecord | null> {
  const authorization = req.header("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;
  const db = await getDb();
  if (!db) return null;
  const sessions = await db.select().from(messengerSessions).where(eq(messengerSessions.tokenHash, tokenHash(token))).limit(1);
  const session = sessions[0];
  if (!session || session.expiresAt <= new Date()) return null;
  const accounts = await db.select().from(messengerAccounts).where(eq(messengerAccounts.id, session.accountId)).limit(1);
  return accounts[0] ?? null;
}

async function requireAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const account = await findAuthenticatedAccount(req);
    if (!account) {
      res.status(401).json({ error: "يلزم تسجيل الدخول بحساب الخادم." });
      return;
    }
    res.locals.account = account;
    const token = (req.header("authorization") || "").slice("Bearer ".length).trim();
    res.locals.sessionTokenHash = tokenHash(token);
    next();
  } catch {
    res.status(503).json({ error: "تعذر التحقق من جلسة الحساب." });
  }
}

function currentAccount(res: Response): AccountRecord {
  return res.locals.account as AccountRecord;
}

async function notifyConversationMembers(conversationId: string, senderId: string, senderName: string, text: string) {
  try {
    const db = await getDb();
    if (!db) return;
    const members = await db.select({ accountId: messengerConversationMembers.accountId }).from(messengerConversationMembers).where(eq(messengerConversationMembers.conversationId, conversationId));
    const recipientIds = members.map((member) => member.accountId).filter((accountId) => accountId !== senderId);
    if (!recipientIds.length) return;
    const tokens = await db.select({ token: messengerPushTokens.token }).from(messengerPushTokens).where(inArray(messengerPushTokens.accountId, recipientIds));
    if (!tokens.length) return;
    await fetch("https://exp.host/--/api/v2/push/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tokens.map(({ token }) => ({ to: token, title: senderName, body: text || "أرسل مرفقًا", sound: "default", data: { conversationId } }))) });
  } catch (error) { console.warn("[Messaging] push notification failed", error); }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MEDIA_BYTES, files: 1 },
});

export const trialMessagingRouter = Router();

trialMessagingRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "حكمة وإيمان" });
});

trialMessagingRouter.get("/server-info", (_req, res) => {
  res.json({ name: "خادم حكمة وإيمان", registrationEnabled: true });
});

trialMessagingRouter.post("/auth/register", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = req.body?.password;
  if (!isValidUsername(username)) {
    res.status(400).json({ error: "اختر اسم مستخدم من 3 إلى 32 حرفًا أو رقمًا، ويمكن استخدام _ أو -." });
    return;
  }
  if (!isValidPassword(password)) {
    res.status(400).json({ error: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل." });
    return;
  }
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    const existing = await db.select({ id: messengerAccounts.id }).from(messengerAccounts).where(eq(messengerAccounts.username, username)).limit(1);
    if (existing[0]) {
      res.status(409).json({ error: "اسم المستخدم مستخدم بالفعل." });
      return;
    }
    const recoveryCode = createRecoveryCode();
    const account = {
      id: randomUUID(),
      username,
      passwordHash: await hashSecret(password),
      recoveryHash: await hashSecret(recoveryCode),
    };
    await db.insert(messengerAccounts).values(account);
    const session = await issueSession(account.id);
    res.status(201).json({ account: { id: account.id, username: account.username }, token: session.token, expiresAt: session.expiresAt.toISOString(), recoveryCode });
  } catch (error) {
    console.error("[Messaging accounts] register failed", error);
    res.status(503).json({ error: "تعذر إنشاء الحساب على الخادم." });
  }
});

trialMessagingRouter.post("/auth/login", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = req.body?.password;
  if (!username || typeof password !== "string") {
    res.status(400).json({ error: "أدخل اسم المستخدم وكلمة المرور." });
    return;
  }
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    const accounts = await db.select().from(messengerAccounts).where(eq(messengerAccounts.username, username)).limit(1);
    const account = accounts[0];
    if (!account || !(await matchesSecret(password, account.passwordHash))) {
      res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيح." });
      return;
    }
    const session = await issueSession(account.id);
    res.json({ account: { id: account.id, username: account.username }, token: session.token, expiresAt: session.expiresAt.toISOString() });
  } catch (error) {
    console.error("[Messaging accounts] login failed", error);
    res.status(503).json({ error: "تعذر تسجيل الدخول إلى الخادم." });
  }
});

trialMessagingRouter.post("/auth/recover", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const recoveryCode = typeof req.body?.recoveryCode === "string" ? req.body.recoveryCode.trim().toUpperCase() : "";
  const password = req.body?.password;
  if (!username || !recoveryCode || !isValidPassword(password)) {
    res.status(400).json({ error: "أدخل اسم المستخدم ورمز الاسترداد وكلمة مرور جديدة من 8 أحرف على الأقل." });
    return;
  }
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    const accounts = await db.select().from(messengerAccounts).where(eq(messengerAccounts.username, username)).limit(1);
    const account = accounts[0];
    if (!account || !(await matchesSecret(recoveryCode, account.recoveryHash))) {
      res.status(401).json({ error: "رمز الاسترداد أو اسم المستخدم غير صحيح." });
      return;
    }
    await db.update(messengerAccounts).set({ passwordHash: await hashSecret(password) }).where(eq(messengerAccounts.id, account.id));
    await db.delete(messengerSessions).where(eq(messengerSessions.accountId, account.id));
    const session = await issueSession(account.id);
    res.json({ account: { id: account.id, username: account.username }, token: session.token, expiresAt: session.expiresAt.toISOString() });
  } catch (error) {
    console.error("[Messaging accounts] recovery failed", error);
    res.status(503).json({ error: "تعذر استرداد الحساب حاليًا." });
  }
});

trialMessagingRouter.use(requireAccount);

trialMessagingRouter.get("/auth/me", (_req, res) => {
  const account = currentAccount(res);
  res.json({ account: { id: account.id, username: account.username } });
});

trialMessagingRouter.get("/auth/profile", (_req, res) => {
  const account = currentAccount(res) as AccountRecord & { avatarUrl?: string | null; backgroundUrl?: string | null };
  res.json({ profile: { avatarUrl: account.avatarUrl || null, backgroundUrl: account.backgroundUrl || null } });
});

trialMessagingRouter.post("/auth/logout", async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    await db.delete(messengerSessions).where(eq(messengerSessions.tokenHash, res.locals.sessionTokenHash));
    res.json({ success: true });
  } catch {
    res.status(503).json({ error: "تعذر إنهاء الجلسة حاليًا." });
  }
});

trialMessagingRouter.post("/auth/change-password", async (req, res) => {
  const currentPassword = req.body?.currentPassword;
  const newPassword = req.body?.newPassword;
  const account = currentAccount(res);
  if (typeof currentPassword !== "string" || !isValidPassword(newPassword)) {
    res.status(400).json({ error: "أدخل كلمة المرور الحالية وكلمة مرور جديدة من 8 أحرف على الأقل." });
    return;
  }
  try {
    if (!(await matchesSecret(currentPassword, account.passwordHash))) {
      res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة." });
      return;
    }
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    await db.update(messengerAccounts).set({ passwordHash: await hashSecret(newPassword) }).where(eq(messengerAccounts.id, account.id));
    await db.delete(messengerSessions).where(eq(messengerSessions.accountId, account.id));
    const session = await issueSession(account.id);
    res.json({ success: true, token: session.token, expiresAt: session.expiresAt.toISOString() });
  } catch (error) {
    console.error("[Messaging accounts] password change failed", error);
    res.status(503).json({ error: "تعذر تغيير كلمة المرور حاليًا." });
  }
});

trialMessagingRouter.get("/accounts", async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    const account = currentAccount(res);
    const accounts = await db.select({ id: messengerAccounts.id, username: messengerAccounts.username }).from(messengerAccounts);
    res.json(accounts.filter((item) => item.id !== account.id));
  } catch {
    res.status(503).json({ error: "تعذر جلب الحسابات المتاحة." });
  }
});

trialMessagingRouter.post("/conversations/direct", async (req, res) => {
  const account = currentAccount(res);
  const username = normalizeUsername(req.body?.username);
  if (!username) {
    res.status(400).json({ error: "أدخل اسم المستخدم لبدء المحادثة." });
    return;
  }
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    const targets = await db.select().from(messengerAccounts).where(eq(messengerAccounts.username, username)).limit(1);
    const target = targets[0];
    if (!target || target.id === account.id) {
      res.status(404).json({ error: "لم يتم العثور على حساب آخر بهذا الاسم." });
      return;
    }
    const ownMemberships = await db.select().from(messengerConversationMembers).where(eq(messengerConversationMembers.accountId, account.id));
    for (const membership of ownMemberships) {
      const members = await db.select().from(messengerConversationMembers).where(eq(messengerConversationMembers.conversationId, membership.conversationId));
      if (members.length === 2 && members.some((item) => item.accountId === target.id)) {
        res.json({ id: membership.conversationId, name: target.username, initials: target.username.slice(0, 2), color: "#0B5FFF", kind: "direct", participants: 2, unread: 0, verified: true, lastMessage: "", time: new Date().toISOString() });
        return;
      }
    }
    const conversationId = `direct-${randomUUID()}`;
    await db.insert(messengerConversations).values({ id: conversationId, kind: "direct" });
    await db.insert(messengerConversationMembers).values([
      { id: `${conversationId}:${account.id}`, conversationId, accountId: account.id },
      { id: `${conversationId}:${target.id}`, conversationId, accountId: target.id },
    ]);
    res.status(201).json({ id: conversationId, name: target.username, initials: target.username.slice(0, 2), color: "#0B5FFF", kind: "direct", participants: 2, unread: 0, verified: true, lastMessage: "", time: new Date().toISOString() });
  } catch (error) {
    console.error("[Messaging] create direct conversation failed", error);
    res.status(503).json({ error: "تعذر إنشاء المحادثة الخاصة." });
  }
});

trialMessagingRouter.get("/conversations", async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    const account = currentAccount(res);
    const memberships = await db.select().from(messengerConversationMembers).where(eq(messengerConversationMembers.accountId, account.id));
    const conversations = memberships.length ? await db.select().from(messengerConversations).where(inArray(messengerConversations.id, memberships.map((item) => item.conversationId))) : [];
    const result = await Promise.all(conversations.map(async (conversation) => {
      const members = await db.select().from(messengerConversationMembers).where(eq(messengerConversationMembers.conversationId, conversation.id));
      const otherMember = members.find((member) => member.accountId !== account.id);
      const other = otherMember ? (await db.select({ username: messengerAccounts.username }).from(messengerAccounts).where(eq(messengerAccounts.id, otherMember.accountId)).limit(1))[0] : null;
      const latest = await db.select().from(messengerMessages).where(eq(messengerMessages.conversationId, conversation.id)).orderBy(desc(messengerMessages.createdAt)).limit(1);
      return { id: conversation.id, name: other?.username || "محادثة خاصة", initials: (other?.username || "مخ").slice(0, 2), color: "#0B5FFF", kind: "direct", participants: members.length, unread: 0, verified: true, lastMessage: latest[0]?.text || "ابدأ محادثة خاصة.", time: latest[0]?.createdAt?.toISOString() || conversation.createdAt.toISOString() };
    }));
    res.json(result.sort((first, second) => second.time.localeCompare(first.time)));
  } catch (error) {
    console.error("[Messaging] list conversations failed", error);
    res.status(503).json({ error: "تعذر جلب المحادثات." });
  }
});

trialMessagingRouter.get("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    const account = currentAccount(res);
    const membership = await db.select({ id: messengerConversationMembers.id }).from(messengerConversationMembers).where(and(eq(messengerConversationMembers.conversationId, req.params.conversationId), eq(messengerConversationMembers.accountId, account.id))).limit(1);
    if (!membership[0]) {
      res.status(403).json({ error: "لا تملك صلاحية الوصول إلى هذه المحادثة." });
      return;
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 100);
    const rows = await db.select().from(messengerMessages).where(eq(messengerMessages.conversationId, req.params.conversationId)).orderBy(messengerMessages.createdAt).limit(limit);
    const readRows = rows.length ? await db.select().from(messengerMessageReads).where(inArray(messengerMessageReads.messageId, rows.map((row) => row.id))) : [];
    const readersByMessage = new Map<string, string[]>();
    for (const receipt of readRows) readersByMessage.set(receipt.messageId, [...(readersByMessage.get(receipt.messageId) || []), receipt.accountId]);
    const accountIds = [...new Set(rows.map((row) => row.senderId))];
    const accounts = accountIds.length ? await db.select({ id: messengerAccounts.id, username: messengerAccounts.username }).from(messengerAccounts).where(inArray(messengerAccounts.id, accountIds)) : [];
    const names = new Map(accounts.map((account) => [account.id, account.username]));
    res.json({ items: rows.map((row) => ({ id: row.id, conversationId: row.conversationId, text: row.text, createdAt: row.createdAt.toISOString(), senderId: row.senderId, senderName: names.get(row.senderId) || "مستخدم", media: row.mediaJson ? JSON.parse(row.mediaJson) : undefined, readBy: readersByMessage.get(row.id) || [] })), nextCursor: undefined });
  } catch (error) {
    console.error("[Messaging] list messages failed", error);
    res.status(503).json({ error: "تعذر جلب الرسائل." });
  }
});

trialMessagingRouter.post("/conversations/:conversationId/messages", async (req, res) => {
  const account = currentAccount(res);
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const mediaIds = Array.isArray(req.body?.mediaIds) ? req.body.mediaIds.map(String).slice(0, 8) : [];
  if (!text && mediaIds.length === 0) {
    res.status(400).json({ error: "يجب أن تحتوي الرسالة على نص أو مرفق." });
    return;
  }
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    const membership = await db.select({ id: messengerConversationMembers.id }).from(messengerConversationMembers).where(and(eq(messengerConversationMembers.conversationId, req.params.conversationId), eq(messengerConversationMembers.accountId, account.id))).limit(1);
    if (!membership[0]) {
      res.status(403).json({ error: "لا تملك صلاحية الإرسال في هذه المحادثة." });
      return;
    }
    const storedMedia = mediaIds.length ? await db.select().from(messengerMedia).where(inArray(messengerMedia.id, mediaIds)) : [];
    const media = storedMedia.filter((item) => item.uploaderId === account.id).map((item) => ({ mediaId: item.id, url: item.storageUrl, mimeType: item.mimeType, size: item.size, name: item.name }));
    const message = { id: `message-${randomUUID()}`, conversationId: req.params.conversationId, senderId: account.id, text, mediaJson: media.length ? JSON.stringify(media) : null };
    await db.insert(messengerMessages).values(message);
    void notifyConversationMembers(req.params.conversationId, account.id, account.username, text);
    res.status(201).json({ ...message, createdAt: new Date().toISOString(), senderName: account.username, media: media.length ? media : undefined });
  } catch (error) {
    console.error("[Messaging] create message failed", error);
    res.status(503).json({ error: "تعذر إرسال الرسالة." });
  }
});

trialMessagingRouter.post("/messages/:messageId/read", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    const account = currentAccount(res);
    const rows = await db.select().from(messengerMessages).where(eq(messengerMessages.id, req.params.messageId)).limit(1);
    const message = rows[0];
    if (!message) { res.status(404).json({ error: "الرسالة غير موجودة." }); return; }
    const membership = await db.select({ id: messengerConversationMembers.id }).from(messengerConversationMembers).where(and(eq(messengerConversationMembers.conversationId, message.conversationId), eq(messengerConversationMembers.accountId, account.id))).limit(1);
    if (!membership[0]) { res.status(403).json({ error: "لا تملك صلاحية قراءة هذه الرسالة." }); return; }
    await db.insert(messengerMessageReads).values({ messageId: message.id, accountId: account.id }).onDuplicateKeyUpdate({ set: { readAt: new Date() } });
    res.json({ success: true, messageId: message.id, readAt: new Date().toISOString() });
  } catch { res.status(503).json({ error: "تعذر تسجيل قراءة الرسالة." }); }
});

trialMessagingRouter.delete("/messages/:messageId", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    const account = currentAccount(res);
    const rows = await db.select().from(messengerMessages).where(eq(messengerMessages.id, req.params.messageId)).limit(1);
    const message = rows[0];
    if (!message) { res.status(404).json({ error: "الرسالة غير موجودة." }); return; }
    const membership = await db.select({ id: messengerConversationMembers.id }).from(messengerConversationMembers).where(and(eq(messengerConversationMembers.conversationId, message.conversationId), eq(messengerConversationMembers.accountId, account.id))).limit(1);
    if (!membership[0]) { res.status(403).json({ error: "لا تملك صلاحية حذف هذه الرسالة." }); return; }
    if (message.senderId !== account.id) { res.status(403).json({ error: "يمكن حذف رسائلك فقط للجميع." }); return; }
    const mediaIds = message.mediaJson ? (JSON.parse(message.mediaJson) as Array<{ mediaId?: string }>).map((item) => item.mediaId).filter((id): id is string => Boolean(id)) : [];
    await db.delete(messengerMessages).where(eq(messengerMessages.id, message.id));
    if (mediaIds.length) await db.delete(messengerMedia).where(inArray(messengerMedia.id, mediaIds));
    res.json({ success: true, deletedForEveryone: true, messageId: message.id });
  } catch (error) { console.error("[Messaging] delete message failed", error); res.status(503).json({ error: "تعذر حذف الرسالة من الخادم." }); }
});

trialMessagingRouter.delete("/conversations/:conversationId", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    const account = currentAccount(res);
    const membership = await db.select({ id: messengerConversationMembers.id }).from(messengerConversationMembers).where(and(eq(messengerConversationMembers.conversationId, req.params.conversationId), eq(messengerConversationMembers.accountId, account.id))).limit(1);
    if (!membership[0]) { res.status(404).json({ error: "المحادثة غير موجودة لديك." }); return; }
    await db.delete(messengerConversationMembers).where(eq(messengerConversationMembers.id, membership[0].id));
    res.json({ success: true, deletedForMe: true, conversationId: req.params.conversationId });
  } catch (error) {
    console.error("[Messaging] delete conversation failed", error);
    res.status(503).json({ error: "تعذر حذف المحادثة من هذا الجهاز." });
  }
});

trialMessagingRouter.post("/media", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "لم يتم استلام ملف." });
    return;
  }
  const account = currentAccount(res);
  try {
    const mediaId = `media-${randomUUID()}`;
    const stored = await storagePut(`messenger-media/${account.id}/${mediaId}-${req.file.originalname}`, req.file.buffer, req.file.mimetype);
    const media = { id: mediaId, uploaderId: account.id, storageUrl: stored.url, mimeType: req.file.mimetype, size: req.file.size, name: req.file.originalname };
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    await db.insert(messengerMedia).values(media);
    res.status(201).json({ mediaId, url: stored.url, mimeType: req.file.mimetype, size: req.file.size, name: req.file.originalname });
  } catch (error) {
    console.error("[Messaging] upload media failed", error);
    res.status(503).json({ error: "تعذر تخزين الملف حاليًا." });
  }
});

trialMessagingRouter.post("/auth/profile/media", upload.single("file"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "لم يتم استلام الصورة." }); return; }
  const kind = req.body?.kind === "background" ? "backgroundUrl" : req.body?.kind === "avatar" ? "avatarUrl" : "";
  if (!kind || !req.file.mimetype.startsWith("image/")) { res.status(400).json({ error: "نوع الصورة غير صالح." }); return; }
  try {
    const account = currentAccount(res);
    const stored = await storagePut(`messenger-profile/${account.id}/${kind}-${randomUUID()}-${req.file.originalname}`, req.file.buffer, req.file.mimetype);
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    await db.update(messengerAccounts).set({ [kind]: stored.url }).where(eq(messengerAccounts.id, account.id));
    res.status(201).json({ kind, url: stored.url });
  } catch (error) { console.error("[Messaging] profile media failed", error); res.status(503).json({ error: "تعذر حفظ الصورة." }); }
});

trialMessagingRouter.delete("/auth/profile/media", async (req, res) => {
  const kind = req.query.kind === "background" ? "backgroundUrl" : req.query.kind === "avatar" ? "avatarUrl" : "";
  if (!kind) { res.status(400).json({ error: "نوع الصورة غير صالح." }); return; }
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    const account = currentAccount(res);
    await db.update(messengerAccounts).set({ [kind]: null }).where(eq(messengerAccounts.id, account.id));
    res.json({ success: true, kind });
  } catch (error) { console.error("[Messaging] profile media delete failed", error); res.status(503).json({ error: "تعذر حذف الصورة من الخادم." }); }
});

trialMessagingRouter.post("/auth/push-token", async (req, res) => {
  const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  const platform = typeof req.body?.platform === "string" ? req.body.platform.trim().slice(0, 16) : "unknown";
  if (!token || token.length > 512) { res.status(400).json({ error: "رمز الإشعار غير صالح." }); return; }
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    const account = currentAccount(res);
    await db.insert(messengerPushTokens).values({ token, accountId: account.id, platform }).onDuplicateKeyUpdate({ set: { accountId: account.id, platform } });
    res.json({ success: true });
  } catch (error) { console.error("[Messaging] push token failed", error); res.status(503).json({ error: "تعذر تسجيل إشعارات الجهاز." }); }
});

export async function hasValidSessionToken(token: string) {
  const db = await getDb();
  if (!db) return false;
  const sessions = await db.select().from(messengerSessions).where(eq(messengerSessions.tokenHash, tokenHash(token))).limit(1);
  return Boolean(sessions[0] && sessions[0].expiresAt > new Date());
}
