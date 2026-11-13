/**
 * Where Abhi Cabs can SOURCE a car, and the direction rule that follows from it (mirrors the backend's src/lib/serviceArea.js):
 *   - the STARTING state decides — a pickup in one of the four states gets a normal availability check;
 *   - a pickup anywhere else becomes a booking REQUEST that our team reviews (never "confirmed");
 *   - the drop can be anywhere.
 * Used by the CMS page types (route / state pages) so generated copy says the right thing for each direction.
 * Generated from seo/coverage.py.
 */
export const OPERATING_STATES = [
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra"
];
export const CITIES_BY_STATE = {
  "Karnataka": [
    "Bengaluru",
    "Mysuru",
    "Mangaluru",
    "Hubballi",
    "Belagavi",
    "Tumakuru",
    "Davanagere",
    "Shivamogga"
  ],
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Tirupati",
    "Nellore",
    "Kurnool",
    "Rajahmundry",
    "Anantapur"
  ],
  "Telangana": [
    "Hyderabad",
    "Warangal",
    "Karimnagar",
    "Nizamabad",
    "Khammam",
    "Mahbubnagar",
    "Nalgonda"
  ],
  "Maharashtra": [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Nashik",
    "Kolhapur",
    "Solapur",
    "Thane",
    "Chhatrapati Sambhajinagar"
  ]
};
export const OTHER_STATE_PLACES = {
  "Chennai": "Tamil Nadu",
  "Coimbatore": "Tamil Nadu",
  "Goa": "Goa",
  "Kochi": "Kerala",
  "Delhi": "Delhi",
  "Jaipur": "Rajasthan",
  "Dehradun": "Uttarakhand",
  "Ahmedabad": "Gujarat",
  "Kolkata": "West Bengal"
};
export const ALIASES = {
  "bangalore": "Bengaluru",
  "mysore": "Mysuru",
  "mangalore": "Mangaluru",
  "hubli": "Hubballi",
  "belgaum": "Belagavi",
  "tumkur": "Tumakuru",
  "shimoga": "Shivamogga",
  "vizag": "Visakhapatnam",
  "vishakhapatnam": "Visakhapatnam",
  "aurangabad": "Chhatrapati Sambhajinagar",
  "bombay": "Mumbai",
  "poona": "Pune",
  "madras": "Chennai",
  "panaji": "Goa"
};

const norm = (s = "") => String(s).trim().toLowerCase().replace(/\s+/g, " ");
export function canonicalPlace(place) {
  const p = norm(place);
  if (ALIASES[p]) return ALIASES[p];
  const all = [...Object.values(CITIES_BY_STATE).flat(), ...Object.keys(OTHER_STATE_PLACES)];
  return all.find((c) => norm(c) === p) || String(place).trim();
}
export function stateOfPlace(place) {
  const c = canonicalPlace(place);
  for (const [state, cities] of Object.entries(CITIES_BY_STATE)) if (cities.includes(c)) return state;
  return OTHER_STATE_PLACES[c] || null;
}
/** "normal" | "request" | "unknown" — decided by where the trip STARTS. */
export function classifyOrigin(place) {
  const s = stateOfPlace(place);
  if (!s) return "unknown";
  return OPERATING_STATES.includes(s) ? "normal" : "request";
}
