import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../config/firebase";
import { User } from "../../types";
import {
  createDocumentWithTimestamp,
  getDocumentWithMillis,
} from "../../utils/firebaseUtils";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

// 회원가입
export const register = createAsyncThunk(
  "auth/register",
  async (
    {
      email,
      password,
      displayName,
    }: { email: string; password: string; displayName: string },
    { rejectWithValue }
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Firebase Auth 프로필 업데이트
      await updateProfile(firebaseUser, { displayName });

      // Firestore에 사용자 정보 저장
      const user: Omit<User, "id"> = {
        email: firebaseUser.email!,
        displayName: displayName,
        photoURL: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await createDocumentWithTimestamp("users", user, firebaseUser.uid);

      return {
        id: firebaseUser.uid,
        ...user,
      } as User;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 로그인
export const login = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Firestore에서 사용자 정보 가져오기
      const user = await getDocumentWithMillis<User>("users", firebaseUser.uid);

      if (!user) {
        throw new Error("User not found in database");
      }

      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 로그아웃
export const signOut = createAsyncThunk(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      await firebaseSignOut(auth);
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Sign Out
      .addCase(signOut.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
