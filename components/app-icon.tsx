import Svg, { Circle, Line, Path, Polygon, Rect } from "react-native-svg";

export type AppIconName =
  | "forum" | "lock" | "cloud-off" | "perm-media" | "privacy-tip" | "play-arrow"
  | "chevron-left" | "close" | "search" | "notifications-active" | "notifications"
  | "info-outline" | "dns" | "check-circle-outline" | "error-outline" | "wifi-tethering"
  | "hourglass-empty" | "stop" | "mic-none" | "chat-bubble-outline" | "groups-2" | "settings"
  | "add" | "edit" | "chat" | "content-copy" | "send" | "arrow-forward" | "verified-user" | "lock-outline" | "photo-library"
  | "photo-camera" | "attach-file" | "done" | "done-all" | "image" | "play-circle-filled" | "reply" | "forward" | "share" | "delete"
  | "audiotrack" | "insert-drive-file" | "download" | "folder" | "file-download" | "folder-open" | "delete-outline" | "delete-forever" | "chat-plus" | "refresh" | "pause" | "movie" | "logout" | "notifications-none";

type AppIconProps = { name: AppIconName; size?: number; color?: string };

/** A compact SVG icon set that does not depend on web-font loading in Expo preview. */
export function AppIcon({ name, size = 24, color = "#10233F" }: AppIconProps) {
  const stroke = { stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none" as const };

  if (name === "play-arrow") return <Svg {...common}><Polygon points="8,5 19,12 8,19" fill={color} /></Svg>;
  if (name === "stop") return <Svg {...common}><Rect x="6" y="6" width="12" height="12" rx="2" fill={color} /></Svg>;
  if (name === "add") return <Svg {...common}><Line x1="12" y1="5" x2="12" y2="19" {...stroke} /><Line x1="5" y1="12" x2="19" y2="12" {...stroke} /></Svg>;
  if (name === "chat" || name === "chat-plus") return <Svg {...common}><Path d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7l-5 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill={color} /><Line x1="12" y1="8" x2="12" y2="13" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" /><Line x1="9.5" y1="10.5" x2="14.5" y2="10.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" /></Svg>;
  if (name === "edit") return <Svg {...common}><Path d="m4 16.8 0 3.2h3.2L18.1 9.1l-3.2-3.2L4 16.8Z" {...stroke} /><Path d="m13.9 6.9 3.2 3.2" {...stroke} /></Svg>;
  if (name === "done" || name === "done-all") return <Svg {...common}><Path d="m5 12 4 4 8-9" {...stroke} />{name === "done-all" ? <Path d="m10 16 8-9" {...stroke} /> : null}</Svg>;
  if (name === "pause") return <Svg {...common}><Line x1="9" y1="6" x2="9" y2="18" {...stroke} /><Line x1="15" y1="6" x2="15" y2="18" {...stroke} /></Svg>;
  if (name === "send") return <Svg {...common}><Path d="m4 5 16 7-16 7 3-7-3-7Z" {...stroke} /></Svg>;
  if (name === "content-copy") return <Svg {...common}><Rect x="8" y="8" width="10" height="11" rx="1" {...stroke} /><Path d="M6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" {...stroke} /></Svg>;if (name === "reply") return <Svg {...common}><Path d="M10 7 5 12l5 5" {...stroke} /><Path d="M5 12h8a6 6 0 0 1 6 6" {...stroke} /></Svg>;
  if (name === "forward") return <Svg {...common}><Path d="M14 5l7 7-7 7" {...stroke} /><Path d="M21 12H9a6 6 0 0 0-6 6" {...stroke} /></Svg>;
  if (name === "share") return <Svg {...common}><Circle cx="18" cy="5" r="2" {...stroke} /><Circle cx="6" cy="12" r="2" {...stroke} /><Circle cx="18" cy="19" r="2" {...stroke} /><Path d="m8 11 8-5M8 13l8 5" {...stroke} /></Svg>;
  if (name === "delete" || name === "delete-outline" || name === "delete-forever") return <Svg {...common}><Path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" {...stroke} /><Line x1="10" y1="11" x2="10" y2="16" {...stroke} /><Line x1="14" y1="11" x2="14" y2="16" {...stroke} /></Svg>;
  if (name === "arrow-forward") return <Svg {...common}><Line x1="4" y1="12" x2="20" y2="12" {...stroke} /><Path d="m14 6 6 6-6 6" {...stroke} /></Svg>;
  if (name === "close") return <Svg {...common}><Line x1="6" y1="6" x2="18" y2="18" {...stroke} /><Line x1="18" y1="6" x2="6" y2="18" {...stroke} /></Svg>;
  if (name === "chevron-left") return <Svg {...common}><Path d="M15 5 8 12l7 7" {...stroke} /></Svg>;
  if (name === "search") return <Svg {...common}><Circle cx="10.5" cy="10.5" r="5.5" {...stroke} /><Line x1="15" y1="15" x2="20" y2="20" {...stroke} /></Svg>;
  if (name === "lock") return <Svg {...common}><Rect x="5" y="10" width="14" height="10" rx="2" {...stroke} /><Path d="M8 10V7a4 4 0 0 1 8 0v3" {...stroke} /></Svg>;
  if (name === "lock-outline") return <Svg {...common}><Rect x="5" y="10" width="14" height="10" rx="2" {...stroke} /><Path d="M8 10V7a4 4 0 0 1 8 0v3" {...stroke} /></Svg>;
  if (name === "forum" || name === "chat-bubble-outline") return <Svg {...common}><Path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-5 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" {...stroke} /></Svg>;
  if (name === "perm-media") return <Svg {...common}><Rect x="3" y="5" width="18" height="14" rx="2" {...stroke} /><Circle cx="8" cy="10" r="1.5" fill={color} /><Path d="m5 17 5-5 3 3 3-3 3 5" {...stroke} /></Svg>;
  if (name === "photo-library" || name === "image") return <Svg {...common}><Rect x="3" y="5" width="18" height="14" rx="2" {...stroke} /><Circle cx="8" cy="10" r="1.5" fill={color} /><Path d="m5 17 5-5 3 3 3-3 3 5" {...stroke} /></Svg>;
  if (name === "photo-camera") return <Svg {...common}><Path d="M4 8h4l1.5-2h5L16 8h4v11H4V8Z" {...stroke} /><Circle cx="12" cy="13" r="3" {...stroke} /></Svg>;
  if (name === "attach-file") return <Svg {...common}><Path d="m9 12 5.5-5.5a3 3 0 0 1 4.2 4.2L11 18.4A4.5 4.5 0 0 1 4.6 12l7.2-7.2" {...stroke} /></Svg>;
  if (name === "cloud-off") return <Svg {...common}><Path d="M6 17h11a4 4 0 0 0 .7-7.9A6 6 0 0 0 7 8.1" {...stroke} /><Line x1="4" y1="4" x2="20" y2="20" {...stroke} /></Svg>;
  if (name === "privacy-tip") return <Svg {...common}><Path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" {...stroke} /><Line x1="12" y1="10" x2="12" y2="14" {...stroke} /><Circle cx="12" cy="17" r=".7" fill={color} /></Svg>;
  if (name === "verified-user") return <Svg {...common}><Path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" {...stroke} /><Path d="m8.5 12 2.2 2.2 4.8-5" {...stroke} /></Svg>;
  if (name === "dns") return <Svg {...common}><Rect x="4" y="4" width="16" height="6" rx="1" {...stroke} /><Rect x="4" y="14" width="16" height="6" rx="1" {...stroke} /><Circle cx="7" cy="7" r="1" fill={color} /><Circle cx="7" cy="17" r="1" fill={color} /></Svg>;
  if (name === "check-circle-outline") return <Svg {...common}><Circle cx="12" cy="12" r="9" {...stroke} /><Path d="m8 12 2.5 2.5L16 9" {...stroke} /></Svg>;
  if (name === "error-outline") return <Svg {...common}><Circle cx="12" cy="12" r="9" {...stroke} /><Line x1="12" y1="7" x2="12" y2="13" {...stroke} /><Circle cx="12" cy="16.5" r=".8" fill={color} /></Svg>;
  if (name === "info-outline") return <Svg {...common}><Circle cx="12" cy="12" r="9" {...stroke} /><Line x1="12" y1="11" x2="12" y2="17" {...stroke} /><Circle cx="12" cy="7.5" r=".8" fill={color} /></Svg>;
  if (name === "notifications" || name === "notifications-active") return <Svg {...common}><Path d="M18 16H6l1.5-2v-4a4.5 4.5 0 0 1 9 0v4l1.5 2Z" {...stroke} /><Path d="M10 19a2.3 2.3 0 0 0 4 0" {...stroke} /></Svg>;
  if (name === "notifications-none") return <Svg {...common}><Path d="M18 16H6l1.5-2v-4a4.5 4.5 0 0 1 9 0v4l1.5 2Z" {...stroke} /><Path d="M10 19a2.3 2.3 0 0 0 4 0" {...stroke} /></Svg>;
  if (name === "wifi-tethering") return <Svg {...common}><Circle cx="12" cy="12" r="2" {...stroke} /><Path d="M6.5 6.5a7.8 7.8 0 0 0 0 11M17.5 6.5a7.8 7.8 0 0 1 0 11M3.5 3.5a12 12 0 0 0 0 17M20.5 3.5a12 12 0 0 1 0 17" {...stroke} /></Svg>;
  if (name === "hourglass-empty") return <Svg {...common}><Path d="M6 4h12M6 20h12M7 4c0 5 5 4 5 8s-5 3-5 8M17 4c0 5-5 4-5 8s5 3 5 8" {...stroke} /></Svg>;
  if (name === "mic-none") return <Svg {...common}><Rect x="9" y="3" width="6" height="11" rx="3" {...stroke} /><Path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" {...stroke} /></Svg>;
  if (name === "logout") return <Svg {...common}><Path d="M10 5H5v14h5" {...stroke} /><Path d="M13 8l4 4-4 4M8 12h9" {...stroke} /></Svg>;
  if (name === "insert-drive-file") return <Svg {...common}><Path d="M7 3h7l4 4v14H7V3Z" {...stroke} /><Path d="M14 3v5h5" {...stroke} /></Svg>;
  if (name === "download") return <Svg {...common}><Path d="M12 4v11M7 11l5 5 5-5M5 20h14" {...stroke} /></Svg>;
  if (name === "folder" || name === "folder-open") return <Svg {...common}><Path d="M3 7h7l2 2h9v10H3V7Z" {...stroke} /></Svg>;
  if (name === "file-download") return <Svg {...common}><Path d="M7 3h7l4 4v14H7V3Z" {...stroke} /><Path d="M14 3v5h5M12 11v5M9.5 13.5 12 16l2.5-2.5" {...stroke} /></Svg>;
  if (name === "play-circle-filled") return <Svg {...common}><Circle cx="12" cy="12" r="9" {...stroke} /><Polygon points="10,8 16,12 10,16" fill={color} /></Svg>;
  if (name === "audiotrack") return <Svg {...common}><Path d="M14 5v10.5a2.5 2.5 0 1 1-2-2.4V7l6-2v8.5a2.5 2.5 0 1 1-2-2.4V5" {...stroke} /></Svg>;
  if (name === "refresh") return <Svg {...common}><Path d="M19 8V4l-2 2a7 7 0 1 0 1.5 7" {...stroke} /><Path d="M19 4v4h-4" {...stroke} /></Svg>;
  if (name === "movie") return <Svg {...common}><Rect x="3" y="5" width="18" height="14" rx="2" {...stroke} /><Path d="m3 9 4-4m2 0 4 4m2-4 4 4M3 15l4 4m2 0 4-4m2 4 4-4" {...stroke} /></Svg>;
  if (name === "groups-2") return <Svg {...common}><Circle cx="9" cy="9" r="3" {...stroke} /><Circle cx="17" cy="10" r="2.5" {...stroke} /><Path d="M3 20c.5-4 3-6 6-6s5.5 2 6 6M14 19c.4-2.5 1.8-4 4-4 2 0 3.5 1.5 4 4" {...stroke} /></Svg>;
  if (name === "settings") return <Svg {...common}><Circle cx="12" cy="12" r="3" {...stroke} /><Path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" {...stroke} /></Svg>;

  return <Svg {...common}><Circle cx="12" cy="12" r="8" {...stroke} /></Svg>;
}
