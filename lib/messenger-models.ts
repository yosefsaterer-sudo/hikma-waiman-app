export type ConversationKind = "direct" | "group";

export type Conversation = {
  id: string;
  name: string;
  initials: string;
  color: string;
  avatarUrl?: string;
  kind: ConversationKind;
  lastMessage: string;
  time: string;
  unread: number;
  verified: boolean;
  online?: boolean;
  participants?: number;
};

export type ChatMessage = {
  id: string;
  text: string;
  time: string;
  outgoing: boolean;
  status: "sent" | "delivered" | "read";
  attachments?: MediaAttachment[];
  replyTo?: { id: string; text: string; outgoing: boolean };
  deleted?: boolean;
};

export type MediaKind = "image" | "video" | "audio" | "file";
export type TransferState = "preparing" | "sending" | "sent" | "received" | "failed";

export type MediaAttachment = {
  id: string;
  kind: MediaKind;
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  progress?: number;
  transferState: TransferState;
};

export const conversations: Conversation[] = [
  {
    id: "layla",
    name: "ليلى عبدالسلام",
    initials: "لع",
    color: "#6D5CE8",
    kind: "direct",
    lastMessage: "أرسلت لك ملخص الاجتماع.",
    time: "10:42",
    unread: 2,
    verified: true,
    online: true,
  },
  {
    id: "team",
    name: "فريق المنتج",
    initials: "فم",
    color: "#0B5FFF",
    kind: "group",
    lastMessage: "سامي: تم اعتماد النسخة الجديدة.",
    time: "09:18",
    unread: 0,
    verified: true,
    participants: 8,
  },
  {
    id: "omar",
    name: "عمر الخالدي",
    initials: "عخ",
    color: "#D06E37",
    kind: "direct",
    lastMessage: "ممتاز، سنكمل غدًا صباحًا.",
    time: "أمس",
    unread: 0,
    verified: true,
  },
  {
    id: "operations",
    name: "العمليات الداخلية",
    initials: "ع",
    color: "#138A5B",
    kind: "group",
    lastMessage: "رنا: تمت مزامنة المجلدات المشتركة.",
    time: "الأحد",
    unread: 5,
    verified: true,
    participants: 14,
  },
  {
    id: "noura",
    name: "نورا الزهراني",
    initials: "نز",
    color: "#B950A8",
    kind: "direct",
    lastMessage: "سأكون متاحة بعد الظهر.",
    time: "الأحد",
    unread: 0,
    verified: false,
  },
];

export const initialMessages: Record<string, ChatMessage[]> = {
  layla: [
    { id: "l1", text: "صباح الخير، هل اطلعت على ملاحظات العميل؟", time: "10:26", outgoing: false, status: "read" },
    { id: "l2", text: "نعم، وأضفت النقاط المهمة إلى النسخة الجديدة.", time: "10:31", outgoing: true, status: "read" },
    {
      id: "l3",
      text: "رائع، أرسلت لك ملخص الاجتماع أيضًا.",
      time: "10:42",
      outgoing: false,
      status: "delivered",
      attachments: [{ id: "l3-a1", kind: "file", uri: "", name: "ملخص-الاجتماع.pdf", mimeType: "application/pdf", size: 324608, transferState: "received" }],
    },
  ],
  team: [
    { id: "t1", text: "تم اعتماد النسخة الجديدة من خارطة الطريق.", time: "09:18", outgoing: false, status: "read" },
    { id: "t2", text: "ممتاز، سأحدّث قائمة الأولويات اليوم.", time: "09:21", outgoing: true, status: "read" },
  ],
  omar: [
    { id: "o1", text: "راجعت العرض، والتسلسل واضح جدًا.", time: "أمس 16:08", outgoing: false, status: "read" },
  ],
  operations: [
    { id: "op1", text: "تمت مزامنة المجلدات المشتركة مع الخادم الداخلي.", time: "الأحد", outgoing: false, status: "read" },
  ],
  noura: [
    { id: "n1", text: "سأكون متاحة بعد الظهر لمراجعة التفاصيل.", time: "الأحد", outgoing: false, status: "delivered" },
  ],
};

export const contacts = conversations.filter((conversation) => conversation.kind === "direct");
