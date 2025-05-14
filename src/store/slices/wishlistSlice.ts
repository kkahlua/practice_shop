import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { WishlistItem, Product } from "../../types";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { getDocumentWithMillis } from "../../utils/firebaseUtils";

interface WishlistState {
  items: (WishlistItem & { product: Product })[];
  loading: boolean;
  error: string | null;
}

const initialState: WishlistState = {
  items: [],
  loading: false,
  error: null,
};

// 위시리스트 가져오기
export const fetchWishlist = createAsyncThunk<
  (WishlistItem & { product: Product })[],
  string
>("wishlist/fetchWishlist", async (userId, { rejectWithValue }) => {
  try {
    const wishlistDoc = await getDoc(doc(db, "wishlists", userId));
    let wishlistItems: WishlistItem[] = [];

    if (wishlistDoc.exists()) {
      wishlistItems = wishlistDoc.data().items || [];
    } else {
      // 위시리스트가 없으면 생성
      await setDoc(doc(db, "wishlists", userId), { items: [] });
    }

    // 각 상품 정보 가져오기
    const wishlistWithProducts = [];

    for (const item of wishlistItems) {
      const product = await getDocumentWithMillis<Product>(
        "products",
        item.productId
      );
      if (product) {
        wishlistWithProducts.push({
          ...item,
          product,
        });
      }
    }

    return wishlistWithProducts;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue("알 수 없는 오류가 발생했습니다.");
  }
});

// 위시리스트에 상품 추가
export const addToWishlist = createAsyncThunk<
  (WishlistItem & { product: Product }) | null,
  {
    userId: string;
    productId: string;
  }
>(
  "wishlist/addToWishlist",
  async ({ userId, productId }, { rejectWithValue }) => {
    try {
      const wishlistRef = doc(db, "wishlists", userId);
      const wishlistDoc = await getDoc(wishlistRef);
      let wishlistItems: WishlistItem[] = [];

      if (wishlistDoc.exists()) {
        wishlistItems = wishlistDoc.data().items || [];
      }

      // 이미 위시리스트에 있는지 확인
      const existingItem = wishlistItems.find(
        (item) => item.productId === productId
      );

      // 없으면 새로 추가
      if (!existingItem) {
        const newItem: WishlistItem = {
          productId,
          addedAt: Date.now(),
        };

        wishlistItems.push(newItem);

        // 위시리스트 업데이트
        await setDoc(wishlistRef, { items: wishlistItems });

        // 상품 정보 가져오기
        const product = await getDocumentWithMillis<Product>(
          "products",
          productId
        );

        if (!product) {
          throw new Error("Product not found");
        }

        return {
          ...newItem,
          product,
        };
      }

      return null; // 이미 있으면 아무 변화 없음
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

// 위시리스트에서 상품 제거
export const removeFromWishlist = createAsyncThunk<
  { productId: string },
  {
    userId: string;
    productId: string;
  }
>(
  "wishlist/removeFromWishlist",
  async ({ userId, productId }, { rejectWithValue }) => {
    try {
      const wishlistRef = doc(db, "wishlists", userId);
      const wishlistDoc = await getDoc(wishlistRef);

      if (!wishlistDoc.exists()) {
        throw new Error("Wishlist not found");
      }

      let wishlistItems: WishlistItem[] = wishlistDoc.data().items || [];

      // 상품 제거
      wishlistItems = wishlistItems.filter(
        (item) => item.productId !== productId
      );

      // 위시리스트 업데이트
      await setDoc(wishlistRef, { items: wishlistItems });

      return { productId };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

// 위시리스트 비우기
export const clearWishlist = createAsyncThunk<boolean, string>(
  "wishlist/clearWishlist",
  async (userId, { rejectWithValue }) => {
    try {
      const wishlistRef = doc(db, "wishlists", userId);

      // 위시리스트 비우기
      await setDoc(wishlistRef, { items: [] });

      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add To Wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items.push(action.payload);
        }
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Remove From Wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(
          (item) => item.productId !== action.payload.productId
        );
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Clear Wishlist
      .addCase(clearWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearWishlist.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default wishlistSlice.reducer;
