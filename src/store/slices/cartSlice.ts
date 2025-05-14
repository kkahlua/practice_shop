import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { CartItem, Product } from "../../types";
import { getDocumentWithMillis } from "../../utils/firebaseUtils";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

interface CartState {
  items: (CartItem & { product: Product })[];
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
};

// 장바구니 가져오기
export const fetchCart = createAsyncThunk<
  (CartItem & { product: Product })[],
  string
>("cart/fetchCart", async (userId, { rejectWithValue }) => {
  try {
    const cartDoc = await getDoc(doc(db, "carts", userId));
    let cartItems: CartItem[] = [];

    if (cartDoc.exists()) {
      cartItems = cartDoc.data().items || [];
    } else {
      // 장바구니가 없으면 생성
      await setDoc(doc(db, "carts", userId), { items: [] });
    }

    // 각 상품 정보 가져오기
    const cartWithProducts = [];

    for (const item of cartItems) {
      const product = await getDocumentWithMillis<Product>(
        "products",
        item.productId
      );
      if (product) {
        cartWithProducts.push({
          ...item,
          product,
        });
      }
    }

    return cartWithProducts;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue("알 수 없는 오류가 발생했습니다.");
  }
});

// 장바구니에 상품 추가
export const addToCart = createAsyncThunk<
  CartItem & { product: Product },
  {
    userId: string;
    productId: string;
    quantity: number;
  }
>(
  "cart/addToCart",
  async ({ userId, productId, quantity }, { rejectWithValue }) => {
    try {
      const cartRef = doc(db, "carts", userId);
      const cartDoc = await getDoc(cartRef);
      let cartItems: CartItem[] = [];

      if (cartDoc.exists()) {
        cartItems = cartDoc.data().items || [];
      }

      // 이미 장바구니에 있는지 확인
      const existingItemIndex = cartItems.findIndex(
        (item) => item.productId === productId
      );

      if (existingItemIndex >= 0) {
        // 이미 있으면 수량 증가
        cartItems[existingItemIndex].quantity += quantity;
      } else {
        // 없으면 새로 추가
        cartItems.push({ productId, quantity });
      }

      // 장바구니 업데이트
      await setDoc(cartRef, { items: cartItems });

      // 상품 정보 가져오기
      const product = await getDocumentWithMillis<Product>(
        "products",
        productId
      );

      if (!product) {
        throw new Error("Product not found");
      }

      // 업데이트된 장바구니 아이템 반환
      return {
        productId,
        quantity:
          existingItemIndex >= 0
            ? cartItems[existingItemIndex].quantity
            : quantity,
        product,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

// 장바구니 상품 수량 변경
export const updateCartItemQuantity = createAsyncThunk<
  {
    productId: string;
    quantity: number;
    product: Product;
    removed: boolean;
  },
  {
    userId: string;
    productId: string;
    quantity: number;
  }
>(
  "cart/updateCartItemQuantity",
  async ({ userId, productId, quantity }, { rejectWithValue }) => {
    try {
      const cartRef = doc(db, "carts", userId);
      const cartDoc = await getDoc(cartRef);

      if (!cartDoc.exists()) {
        throw new Error("Cart not found");
      }

      let cartItems: CartItem[] = cartDoc.data().items || [];

      // 상품 찾기
      const itemIndex = cartItems.findIndex(
        (item) => item.productId === productId
      );

      if (itemIndex < 0) {
        throw new Error("Item not found in cart");
      }

      // 수량이 0 이하면 제거, 아니면 업데이트
      if (quantity <= 0) {
        cartItems = cartItems.filter((item) => item.productId !== productId);
      } else {
        cartItems[itemIndex].quantity = quantity;
      }

      // 장바구니 업데이트
      await setDoc(cartRef, { items: cartItems });

      // 상품 정보 가져오기
      const product = await getDocumentWithMillis<Product>(
        "products",
        productId
      );

      if (!product) {
        throw new Error("Product not found");
      }

      return {
        productId,
        quantity,
        product,
        removed: quantity <= 0,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

// 장바구니에서 상품 제거
export const removeFromCart = createAsyncThunk<
  { productId: string },
  {
    userId: string;
    productId: string;
  }
>("cart/removeFromCart", async ({ userId, productId }, { rejectWithValue }) => {
  try {
    const cartRef = doc(db, "carts", userId);
    const cartDoc = await getDoc(cartRef);

    if (!cartDoc.exists()) {
      throw new Error("Cart not found");
    }

    let cartItems: CartItem[] = cartDoc.data().items || [];

    // 상품 제거
    cartItems = cartItems.filter((item) => item.productId !== productId);

    // 장바구니 업데이트
    await setDoc(cartRef, { items: cartItems });

    return { productId };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue("알 수 없는 오류가 발생했습니다.");
  }
});

// 장바구니 비우기
export const clearCart = createAsyncThunk<boolean, string>(
  "cart/clearCart",
  async (userId, { rejectWithValue }) => {
    try {
      const cartRef = doc(db, "carts", userId);

      // 장바구니 비우기
      await setDoc(cartRef, { items: [] });

      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add To Cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        const existingItemIndex = state.items.findIndex(
          (item) => item.productId === action.payload.productId
        );

        if (existingItemIndex >= 0) {
          state.items[existingItemIndex].quantity = action.payload.quantity;
        } else {
          state.items.push(action.payload);
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Cart Item Quantity
      .addCase(updateCartItemQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.loading = false;

        if (action.payload.removed) {
          state.items = state.items.filter(
            (item) => item.productId !== action.payload.productId
          );
        } else {
          const itemIndex = state.items.findIndex(
            (item) => item.productId === action.payload.productId
          );

          if (itemIndex >= 0) {
            state.items[itemIndex].quantity = action.payload.quantity;
          }
        }
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Remove From Cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(
          (item) => item.productId !== action.payload.productId
        );
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default cartSlice.reducer;
