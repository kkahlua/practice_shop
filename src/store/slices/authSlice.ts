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
  updateDocumentWithTimestamp,
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
export const register = createAsyncThunk<
  User,
  { email: string; password: string; displayName: string }
>(
  "auth/register",
  async ({ email, password, displayName }, { rejectWithValue }) => {
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

// 로그인
export const login = createAsyncThunk<
  User,
  { email: string; password: string }
>("auth/login", async ({ email, password }, { rejectWithValue }) => {
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue("알 수 없는 오류가 발생했습니다.");
  }
});

// 로그아웃
export const signOut = createAsyncThunk<void, void>(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      await firebaseSignOut(auth);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

// 사용자 정보 업데이트
export const updateUserProfile = createAsyncThunk<
  User,
  {
    userId: string;
    displayName?: string;
    photoURL?: string;
    address?: string;
    phoneNumber?: string;
  }
>(
  "auth/updateUserProfile",
  async (
    { userId, displayName, photoURL, address, phoneNumber },
    { rejectWithValue }
  ) => {
    try {
      // Firebase Auth 유저 정보 업데이트
      if (auth.currentUser) {
        if (displayName) {
          await updateProfile(auth.currentUser, { displayName });
        }
        if (photoURL) {
          await updateProfile(auth.currentUser, { photoURL });
        }
      }

      // Firestore 유저 정보 업데이트
      const updateData: Partial<User> = {};

      if (displayName) updateData.displayName = displayName;
      if (photoURL) updateData.photoURL = photoURL;
      if (address) updateData.address = address;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;

      await updateDocumentWithTimestamp("users", userId, updateData);

      // 업데이트된 유저 정보 가져오기
      const updatedUser = await getDocumentWithMillis<User>("users", userId);

      if (!updatedUser) {
        throw new Error("Failed to retrieve updated user data");
      }

      return updatedUser;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
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
      })
      //Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
