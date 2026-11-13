import { createSlice } from "@reduxjs/toolkit";
import { loadState, saveState } from "../persist";

const initialState = {
  selectedCab: loadState("selectedCab", null)
};

const selectionSlice = createSlice({
  name: "selection",
  initialState,
  reducers: {
    setSelectedCab(state, action) {
      state.selectedCab = action.payload;
      saveState("selectedCab", state.selectedCab);
    }
  },
  extraReducers: (builder) => {
    builder.addCase("REHYDRATE", (state, action) => {
      if (action.payload.selectedCab) state.selectedCab = action.payload.selectedCab;
    });
  },
});

export const { setSelectedCab } = selectionSlice.actions;
export const selectSelectedCab = (state) => state.selection.selectedCab;

export default selectionSlice.reducer;
