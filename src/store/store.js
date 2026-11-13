import { configureStore } from "@reduxjs/toolkit";
import journeyReducer from "./slices/journeySlice";
import bookingReducer from "./slices/bookingSlice";
import selectionReducer from "./slices/selectionSlice";
import uiReducer from "./slices/uiSlice";
import checkoutReducer from "./slices/checkoutSlice";
import { rehydrateFromStorage } from "./persist";

export function createReduxStore() {
  return configureStore({
    reducer: {
      journey: journeyReducer,
      booking: bookingReducer,
      selection: selectionReducer,
      ui: uiReducer,
      checkout: checkoutReducer
    }
  });
}

// Singleton store. SSR is enabled (pages/+config.js, ssr:true) so the
// initial state MUST match between server and client. localStorage
// values are deferred until after hydration — see persist.js.
export const store = createReduxStore();

/**
 * Call once from Layout's useEffect (after hydration). Reads persisted
 * values from localStorage and dispatches them into the store.
 */
export function rehydrateStore() {
  rehydrateFromStorage(store);
}
