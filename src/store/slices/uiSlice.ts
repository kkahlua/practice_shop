import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  darkMode: boolean;
}

const initialState: UiState = {
  darkMode: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
  },
});

export const { toggleDarkMode, setDarkMode } = uiSlice.actions;

export default uiSlice.reducer;
