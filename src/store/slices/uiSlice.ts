import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  darkMode: boolean;
  modals: {
    login: boolean;
    signup: boolean;
    cart: boolean;
    checkout: boolean;
  };
  toast: {
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
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
  toast: {
    show: false,
    message: "",
    type: "info",
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
    showToast: (
      state,
      action: PayloadAction<{
        message: string;
        type: "success" | "error" | "info";
      }>
    ) => {
      state.toast = {
        show: true,
        message: action.payload.message,
        type: action.payload.type,
      };
    },
    hideToast: (state) => {
      state.toast.show = false;
    },
  },
});

export const {
  toggleDarkMode,
  setDarkMode,
  setModalStatus,
  showToast,
  hideToast,
} = uiSlice.actions;

export default uiSlice.reducer;
