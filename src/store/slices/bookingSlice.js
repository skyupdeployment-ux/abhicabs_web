/**
 * src/store/slices/bookingSlice.js
 *
 * SSR FIX: REHYDRATE action restores localStorage values after hydration
 * instead of during slice init, preventing React #418.
 */
import { createSlice } from "@reduxjs/toolkit";
import { loadState, saveState } from "../persist";

const SLIM_FIELDS = [
  "id", "bookingId", "bookingNumber", "status",
  "pickup", "pickupAddress", "drop", "dropAddress",
  "date", "time", "tripType", "returnDate", "returnTime",
  "vehicleCategory", "vehicleClass", "vehicle", "vehicleSeats", "vehicleImg",
  "fare", "estimatedFare", "finalFare",
  "paymentMode", "paymentStatus", "paymentStatusReal",
  "passengerName", "mobile", "email",
  "customerType", "companyName", "gstNumber",
  "createdAt", "pickupAt",
];

function slimBooking(fields) {
  const out = {};
  SLIM_FIELDS.forEach((k) => { if (fields[k] !== undefined) out[k] = fields[k]; });
  return out;
}

const initialState = {
  items:         loadState("bookings", []),
  lastBookingId: loadState("lastBookingId", null),
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    createBooking: {
      reducer(state, action) {
        const booking = action.payload;
        const exists = state.items.some(
          (b) => b.bookingId === booking.bookingId || b.id === booking.id
        );
        if (!exists) {
          state.items.unshift(booking);
        }
        state.lastBookingId = booking.id || booking.bookingId;
        saveState("bookings", state.items);
        saveState("lastBookingId", state.lastBookingId);
      },
      prepare(fields) {
        const booking = slimBooking({
          ...fields,
          bookingId: fields.id || fields.bookingId || fields.bookingNumber,
          createdAt: fields.createdAt || new Date().toISOString(),
          status:    fields.status || "PENDING",
        });
        return { payload: booking };
      },
    },

    cancelBooking(state, action) {
      const idToCancel = action.payload;
      const b = state.items.find(
        (x) => x.id === idToCancel || x.bookingId === idToCancel
      );
      if (b) {
        b.status = "CANCELLED";
        saveState("bookings", state.items);
      }
    },

    syncBookings(state, action) {
      const incoming = action.payload;
      if (!Array.isArray(incoming)) return;
      incoming.forEach((serverBooking) => {
        const slim = slimBooking({
          ...serverBooking,
          bookingId: serverBooking.id || serverBooking.bookingId,
        });
        const idx = state.items.findIndex(
          (b) => b.id === serverBooking.id || b.bookingId === serverBooking.id
        );
        if (idx >= 0) {
          state.items[idx] = { ...state.items[idx], ...slim };
        } else {
          state.items.push(slim);
        }
      });
      saveState("bookings", state.items);
    },
  },
  extraReducers: (builder) => {
    builder.addCase("REHYDRATE", (state, action) => {
      const p = action.payload;
      if (Array.isArray(p.bookings) && p.bookings.length) state.items = p.bookings;
      if (p.lastBookingId) state.lastBookingId = p.lastBookingId;
    });
  },
});

export const { createBooking, cancelBooking, syncBookings } = bookingSlice.actions;

export const selectAllBookings  = (state) => state.booking.items;
export const selectBooking      = (id) => (state) =>
  state.booking.items.find((b) => b.id === id || b.bookingId === id) || null;

export const selectActiveBooking = (state) =>
  state.booking.items.find((b) =>
    ["PENDING", "CONFIRMED", "ALLOCATED", "EN_ROUTE", "ONGOING", "ARRIVED",
     "upcoming", "ongoing"].includes(b.status)
  ) || null;

export default bookingSlice.reducer;
