import {
  Clock, Plane, Navigation, Repeat, Building2, ShieldCheck, BadgeDollarSign, MapPin, PhoneCall,
  Wallet, Headset, Car, Users, Route, LifeBuoy, Briefcase, Handshake, Luggage,
  CalendarDays, Map as MapIcon, User, Globe,
} from "lucide-react";

/** CMS/content files refer to icons by name; this resolves them. Add new icons here. */
export const ICONS = {
  clock: Clock, plane: Plane, navigation: Navigation, repeat: Repeat, building: Building2,
  shield: ShieldCheck, price: BadgeDollarSign, pin: MapPin, phone: PhoneCall, wallet: Wallet,
  headset: Headset, car: Car, users: Users, route: Route, lifebuoy: LifeBuoy, briefcase: Briefcase, handshake: Handshake, luggage: Luggage,
  calendar: CalendarDays, map: MapIcon, user: User, globe: Globe,
};
export const getIcon = (name, fallback = Car) => ICONS[name] || fallback;

/** A feature item may carry a lucide component (`Icon`) or a CMS icon name (`icon`). Always returns a renderable component. */
export const resolveIcon = (item, fallback = Car) =>
  item?.Icon || getIcon(item?.icon, fallback);

/** Reverse lookup: lucide component → content icon name (for seeding the CMS from code defaults). */
export const iconName = (Component, fallback = "shield") => Object.entries(ICONS).find(([, C]) => C === Component)?.[0] || fallback;
