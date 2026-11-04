import { int, mysqlEnum, mysqlTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Local username/password accounts for the private messaging server. */
export const messengerAccounts = mysqlTable("messenger_accounts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  recoveryHash: varchar("recoveryHash", { length: 255 }).notNull(),
  avatarUrl: text("avatarUrl"),
  backgroundUrl: text("backgroundUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Opaque sessions issued after username/password authentication. */
export const messengerSessions = mysqlTable("messenger_sessions", {
  tokenHash: varchar("tokenHash", { length: 128 }).primaryKey(),
  accountId: varchar("accountId", { length: 36 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Expo push tokens registered per private-server account/device. */
export const messengerPushTokens = mysqlTable("messenger_push_tokens", {
  token: varchar("token", { length: 512 }).primaryKey(),
  accountId: varchar("accountId", { length: 36 }).notNull(),
  platform: varchar("platform", { length: 16 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Direct conversations shared only by their account members. */
export const messengerConversations = mysqlTable("messenger_conversations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  kind: varchar("kind", { length: 16 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Membership is checked before a user can list or send conversation messages. */
export const messengerConversationMembers = mysqlTable("messenger_conversation_members", {
  id: varchar("id", { length: 80 }).primaryKey(),
  conversationId: varchar("conversationId", { length: 64 }).notNull(),
  accountId: varchar("accountId", { length: 36 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Message metadata is persistent; message attachments are stored as JSON text. */
export const messengerMessages = mysqlTable("messenger_messages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  conversationId: varchar("conversationId", { length: 64 }).notNull(),
  senderId: varchar("senderId", { length: 36 }).notNull(),
  text: text("text").notNull(),
  mediaJson: text("mediaJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Per-account read receipts for cross-device delivery/read status. */
export const messengerMessageReads = mysqlTable("messenger_message_reads", {
  messageId: varchar("messageId", { length: 64 }).notNull(),
  accountId: varchar("accountId", { length: 36 }).notNull(),
  readAt: timestamp("readAt").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.messageId, table.accountId] }),
}));

/** Persistent records for uploaded files and their storage paths. */
export const messengerMedia = mysqlTable("messenger_media", {
  id: varchar("id", { length: 64 }).primaryKey(),
  uploaderId: varchar("uploaderId", { length: 36 }).notNull(),
  storageUrl: text("storageUrl").notNull(),
  mimeType: varchar("mimeType", { length: 160 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  size: int("size").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessengerAccount = typeof messengerAccounts.$inferSelect;
export type MessengerSession = typeof messengerSessions.$inferSelect;
export type MessengerPushToken = typeof messengerPushTokens.$inferSelect;
export type MessengerConversation = typeof messengerConversations.$inferSelect;
export type MessengerConversationMember = typeof messengerConversationMembers.$inferSelect;
export type MessengerMessage = typeof messengerMessages.$inferSelect;
export type MessengerMessageRead = typeof messengerMessageReads.$inferSelect;
export type MessengerMedia = typeof messengerMedia.$inferSelect;
