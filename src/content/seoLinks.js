/**
 * Internal linking: which guides each kind of service page links to. Keyed by the page's booking mode
 * ("" = enquiry-only pages such as group vehicles and corporate). Articles link back to the service pages,
 * so each topic forms a small cluster (service page ↔ guides). Anchor text = the article's own headline, so it stays natural.
 */
export const GUIDES_BY_MODE = {
  "one-way": ["one-way-cab-vs-round-trip-cab", "what-is-a-one-way-drop-taxi", "what-is-included-in-an-outstation-cab-fare"],
  "round-trip": ["one-way-cab-vs-round-trip-cab", "long-distance-road-trip-checklist", "how-to-choose-a-cab-for-a-family-trip"],
  local: ["local-taxi-vs-outstation-taxi", "how-to-book-a-cab-online", "things-to-check-before-confirming-a-taxi-booking"],
  airport: ["how-to-book-an-airport-taxi", "things-to-check-before-confirming-a-taxi-booking", "how-to-book-a-cab-online"],
  "": ["how-to-choose-a-tempo-traveller", "things-to-check-before-confirming-a-taxi-booking", "how-to-choose-a-cab-for-a-family-trip"],
};
