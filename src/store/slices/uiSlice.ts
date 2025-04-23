import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  darkMode: boolean;
  modals: {
    login: boolean;
    signup: boolean;
    cart: boolean;
    checkout: boolean;
  };
}

const initialState: UiState = {
  darkMode: false,
  modals: {
    login: false,
    signup: false,
    cart: false,
    checkout: false,
  },
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
    setModalStatus: (
      state,
      action: PayloadAction<{ modal: keyof UiState["modals"]; status: boolean }>
    ) => {
      state.modals[action.payload.modal] = action.payload.status;
    },
  },
});

export const { toggleDarkMode, setDarkMode, setModalStatus } = uiSlice.actions;

export default uiSlice.reducer;
