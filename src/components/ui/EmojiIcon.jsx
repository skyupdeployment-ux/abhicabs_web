import {
  CheckCircle2, ShieldCheck, Wallet, Car, Phone, Briefcase, User, Users,
  MessageCircle, MapPin, FileText, Home, BookOpen, Route, Plane, PartyPopper,
  Star, Building2, Compass, Target, Clock, Sparkles, BadgeCheck,
} from "lucide-react";

// Maps the emojis used as content/UI glyphs across the site to lucide icons.
// Anything not in the map falls back to the original glyph, so it's safe for
// CMS-entered content too.
const MAP = {
  "✅": CheckCircle2, "☑️": CheckCircle2, "✔️": BadgeCheck, "🛡️": ShieldCheck, "🛡": ShieldCheck,
  "💰": Wallet, "💵": Wallet, "💸": Wallet,
  "🚗": Car, "🚕": Car, "🚙": Car,
  "📞": Phone, "☎️": Phone, "📱": Phone,
  "🧳": Briefcase, "💼": Briefcase,
  "👤": User, "🧑": User, "🙂": User,
  "👥": Users,
  "💬": MessageCircle, "🗨️": MessageCircle,
  "📍": MapPin, "📌": MapPin,
  "📝": FileText, "📄": FileText, "📃": FileText, "📑": FileText,
  "🏠": Home, "🏡": Home,
  "📖": BookOpen, "📚": BookOpen,
  "🛣️": Route, "🛣": Route, "🧭": Compass,
  "✈️": Plane, "✈": Plane,
  "🎉": PartyPopper, "🎊": PartyPopper,
  "⭐": Star, "🌟": Star, "✨": Sparkles,
  "🏢": Building2, "🏬": Building2,
  "🎯": Target,
  "⏰": Clock, "🕐": Clock, "⌚": Clock,
};

export default function EmojiIcon({ glyph, size = 24, color = "currentColor", strokeWidth = 2, className, style }) {
  const key = String(glyph || "").trim();
  const Icon = MAP[key];
  if (Icon) {
    return <Icon size={size} color={color} strokeWidth={strokeWidth} className={className} style={{ display: "inline-block", verticalAlign: "middle", ...style }} />;
  }
  // Unknown glyph — render it as-is so nothing disappears.
  return <span className={className} style={{ fontSize: size * 0.9, lineHeight: 1, ...style }}>{glyph}</span>;
}
