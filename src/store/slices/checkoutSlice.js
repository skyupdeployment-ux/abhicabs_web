import { createSlice } from "@reduxjs/toolkit";
import { loadState, saveState } from "../persist";

const DEFAULTS = {
  fullName: "",
  mobile: "",
  email: "",
  gstNumber: "",
  companyName: "",
  paxCount: "2",
  notes: "",
  customerType: "retail",
  // "personal" = GST tax invoice without a GSTIN; "business" = with company GSTIN
  gstMode: "personal",
  paymentMode: "FULL",
};

const initialState = {
  details: loadState("checkoutDetails", DEFAULTS),
};

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    setCheckoutDetails(state, action) {
      state.details = { ...state.details, ...action.payload };
      saveState("checkoutDetails", state.details);
    },
    clearCheckoutDetails(state) {
      state.details = DEFAULTS;
      saveState("checkoutDetails", state.details);
    },
  },
  extraReducers: (builder) => {
    builder.addCase("REHYDRATE", (state, action) => {
      if (action.payload.checkoutDetails) {
        state.details = { ...DEFAULTS, ...action.payload.checkoutDetails };
      }
    });
  },
});

export const { setCheckoutDetails, clearCheckoutDetails } = checkoutSlice.actions;
export const selectCheckoutDetails = (state) => state.checkout.details;

export default checkoutSlice.reducer;
