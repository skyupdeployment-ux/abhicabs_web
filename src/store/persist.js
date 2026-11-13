// Thin persistence helpers. These are the only place that touches
// localStorage, so swapping in a real backend later means replacing the
// thunks in the slices, not this file.
//
// SSR FIX (React #418 hydration mismatch):
// ─────────────────────────────────────────
// `loadState` ALWAYS returns the fallback during the initial module
// evaluation — even in the browser. This guarantees that every Redux
// slice's `initialState` is identical on the server and the client,
// which is exactly what React's hydration check compares.
//
// Stored values are recovered by `rehydrateFromStorage()`, which is
// called ONCE from Layout's useEffect (after hydration is done). The
// slices that persist data handle the REHYDRATE action to merge the
// stored values back in, and from that point on everything works as
// before — it just doesn't race hydration.

const isBrowser = typeof window !== "undefined";

// Flipped to true by rehydrateFromStorage() after hydration is complete.
let _hydrated = false;

/**
 * Read a persisted value. Returns the fallback until rehydrateFromStorage()
 * has been called (i.e. during SSR and during client hydration).
 */
export function loadState(key, fallback) {
  if (!_hydrated || !isBrowser) return fallback;
  try {
    const raw = localStorage.getItem("abhi_" + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Read a value directly from localStorage, bypassing the hydration gate.
 * Used only by rehydrateFromStorage().
 */
function readStorage(key, fallback) {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem("abhi_" + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveState(key, value) {
  if (!isBrowser) return;
  try {
    localStorage.setItem("abhi_" + key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — fail silently */
  }
}

/**
 * Called ONCE from Layout's useEffect, after React has finished hydrating.
 * Dispatches a single REHYDRATE action with every persisted value.
 */
export function rehydrateFromStorage(store) {
  if (!isBrowser || _hydrated) return;
  _hydrated = true;

  store.dispatch({
    type: "REHYDRATE",
    payload: {
      journeys:        readStorage("journeys", {}),
      lastJourneyId:   readStorage("lastJourneyId", null),
      selectedCab:     readStorage("selectedCab", null),
      bookings:        readStorage("bookings", []),
      lastBookingId:   readStorage("lastBookingId", null),
      checkoutDetails: readStorage("checkoutDetails", null),
    },
  });
}
