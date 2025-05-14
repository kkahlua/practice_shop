import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Product, Review } from "../../types";
import {
  getCollectionWithMillis,
  getDocumentWithMillis,
  createDocumentWithTimestamp,
  updateDocumentWithTimestamp,
  QueryConstraint,
} from "../../utils/firebaseUtils";

interface ProductsState {
  items: Product[];
  currentProduct: Product | null;
  reviews: Review[];
  loading: boolean;
  error: string | null;
  filters: {
    category: string | null;
    priceRange: [number, number] | null;
    search: string;
    sortBy: "price-asc" | "price-desc" | "rating-desc" | "newest";
  };
}

const initialState: ProductsState = {
  items: [],
  currentProduct: null,
  reviews: [],
  loading: false,
  error: null,
  filters: {
    category: null,
    priceRange: null,
    search: "",
    sortBy: "newest",
  },
};

// 모든 상품 가져오기
export const fetchProducts = createAsyncThunk<Product[], void>(
  "products/fetchProducts",
  async (_, { rejectWithValue }) => {
    try {
      const products = await getCollectionWithMillis<Product>("products");
      return products;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

// 필터링된 상품 가져오기
export const fetchFilteredProducts = createAsyncThunk<
  Product[],
  void,
  { state: { products: ProductsState } }
>(
  "products/fetchFilteredProducts",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const { category, priceRange, search, sortBy } = state.products.filters;

      const constraints: QueryConstraint[] = [];

      // 카테고리 필터
      if (category) {
        constraints.push({
          field: "category",
          operator: "==",
          value: category,
        });
      }

      // 가격 범위 필터링
      if (priceRange) {
        constraints.push({
          field: "price",
          operator: ">=",
          value: priceRange[0],
        });

        constraints.push({
          field: "price",
          operator: "<=",
          value: priceRange[1],
        });
      }

      // 정렬 설정
      if (sortBy === "price-asc") {
        constraints.push({
          orderByField: "price",
          orderDirection: "asc",
        });
      } else if (sortBy === "price-desc") {
        constraints.push({
          orderByField: "price",
          orderDirection: "desc",
        });
      } else if (sortBy === "rating-desc") {
        constraints.push({
          orderByField: "rating",
          orderDirection: "desc",
        });
      } else if (sortBy === "newest") {
        constraints.push({
          orderByField: "createdAt",
          orderDirection: "desc",
        });
      }

      const products = await getCollectionWithMillis<Product>(
        "products",
        constraints
      );

      // 검색어 필터링 (클라이언트 사이드에서 처리)
      let filteredProducts = products;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredProducts = products.filter(
          (product) =>
            product.name.toLowerCase().includes(searchLower) ||
            product.description.toLowerCase().includes(searchLower)
        );
      }

      return filteredProducts;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

// 특정 상품 가져오기
export const fetchProductById = createAsyncThunk<Product, string>(
  "products/fetchProductById",
  async (productId, { rejectWithValue }) => {
    try {
      const product = await getDocumentWithMillis<Product>(
        "products",
        productId
      );

      if (!product) {
        throw new Error("Product not found");
      }

      return product;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

// 상품 리뷰 가져오기
export const fetchProductReviews = createAsyncThunk<Review[], string>(
  "products/fetchProductReviews",
  async (productId, { rejectWithValue }) => {
    try {
      const constraints: QueryConstraint[] = [
        {
          field: "productId",
          operator: "==",
          value: productId,
        },
        {
          orderByField: "createdAt",
          orderDirection: "desc",
        },
      ];

      const reviews = await getCollectionWithMillis<Review>(
        "reviews",
        constraints
      );
      return reviews;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

// 리뷰 데이터 인터페이스
interface ReviewData {
  productId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  photos?: string[];
}

// 리뷰 추가하기
export const addReview = createAsyncThunk<
  { review: Review | null; product: Product | null },
  ReviewData
>(
  "products/addReview",
  async (
    { productId, userId, userName, userPhoto, rating, comment, photos },
    { rejectWithValue }
  ) => {
    try {
      // 리뷰 생성
      const reviewData: ReviewData = {
        productId,
        userId,
        userName,
        rating,
        comment,
      };

      // userPhoto가 있을 때만 추가
      if (userPhoto) {
        reviewData.userPhoto = userPhoto;
      }

      // photos가 있을 때만 추가
      if (photos && photos.length > 0) {
        reviewData.photos = photos;
      }

      const reviewId = await createDocumentWithTimestamp("reviews", reviewData);

      // 상품의 평점 업데이트
      const product = await getDocumentWithMillis<Product>(
        "products",
        productId
      );

      if (!product) {
        throw new Error("Product not found");
      }

      // 현재 리뷰들 가져오기
      const constraints: QueryConstraint[] = [
        {
          field: "productId",
          operator: "==",
          value: productId,
        },
      ];

      const reviews = await getCollectionWithMillis<Review>(
        "reviews",
        constraints
      );

      // 새로운 평균 평점 계산
      const totalRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) + rating;
      const newRating = totalRating / (reviews.length + 1);

      // 상품 평점 업데이트
      await updateDocumentWithTimestamp("products", productId, {
        rating: newRating,
        numReviews: reviews.length + 1,
      });

      // 새로운 리뷰와 업데이트된 상품 반환
      const createdReview = await getDocumentWithMillis<Review>(
        "reviews",
        reviewId
      );
      const updatedProduct = await getDocumentWithMillis<Product>(
        "products",
        productId
      );

      return { review: createdReview, product: updatedProduct };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

// 필터 설정
export const setProductFilters = createAsyncThunk<
  Partial<ProductsState["filters"]>,
  Partial<ProductsState["filters"]>,
  { state: { products: ProductsState } }
>("products/setProductFilters", async (filters, { dispatch }) => {
  // 필터 설정 후 상품 다시 가져오기
  await dispatch(fetchFilteredProducts());
  return filters;
});

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setFilters: (
      state,
      action: PayloadAction<Partial<ProductsState["filters"]>>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.reviews = [];
    },
    updateCurrentProduct: (state, action: PayloadAction<Product>) => {
      state.currentProduct = action.payload;
    },
    updateReviews: (state, action: PayloadAction<Review[]>) => {
      state.reviews = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Filtered Products
      .addCase(fetchFilteredProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFilteredProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchFilteredProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Product By Id
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Product Reviews
      .addCase(fetchProductReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Review
      .addCase(addReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.review) {
          state.reviews = [action.payload.review, ...state.reviews];
        }
        state.currentProduct = action.payload.product || state.currentProduct;
      })
      .addCase(addReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Set Filters
      .addCase(setProductFilters.fulfilled, (state, action) => {
        state.filters = { ...state.filters, ...action.payload };
      });
  },
});

export const {
  setFilters,
  clearCurrentProduct,
  updateCurrentProduct,
  updateReviews,
} = productsSlice.actions;
export default productsSlice.reducer;
