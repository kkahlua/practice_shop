import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Product, Review } from "../../types";
import {
  getCollectionWithMillis,
  getDocumentWithMillis,
  createDocumentWithTimestamp,
  updateDocumentWithTimestamp,
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
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (_, { rejectWithValue }) => {
    try {
      const products = await getCollectionWithMillis<Product>("products");
      return products;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 필터링된 상품 가져오기
export const fetchFilteredProducts = createAsyncThunk(
  "products/fetchFilteredProducts",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { products: ProductsState };
      const { category, priceRange, search, sortBy } = state.products.filters;
      const allProducts = await getCollectionWithMillis<Product>("products");

      // 필터링 로직을 클라이언트 측에서 처리
      let filteredProducts = [...allProducts];

      // 카테고리 필터링
      if (category) {
        filteredProducts = filteredProducts.filter(
          (product) => product.category === category
        );
      }

      // 가격 범위 필터링
      if (priceRange) {
        filteredProducts = filteredProducts.filter(
          (product) =>
            product.price >= priceRange[0] && product.price <= priceRange[1]
        );
      }

      // 검색어 필터링
      if (search && search.trim() !== "") {
        const searchLower = search.toLowerCase();
        filteredProducts = filteredProducts.filter(
          (product) =>
            product.name.toLowerCase().includes(searchLower) ||
            product.description.toLowerCase().includes(searchLower)
        );
      }

      // 정렬 적용
      switch (sortBy) {
        case "price-asc":
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case "price-desc":
          filteredProducts.sort((a, b) => b.price - a.price);
          break;
        case "rating-desc":
          filteredProducts.sort((a, b) => b.rating - a.rating);
          break;
        case "newest":
          filteredProducts.sort((a, b) => b.createdAt - a.createdAt);
          break;
      }
      return filteredProducts;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 특정 상품 가져오기
export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (productId: string, { rejectWithValue }) => {
    try {
      const product = await getDocumentWithMillis<Product>(
        "products",
        productId
      );

      if (!product) {
        throw new Error("Product not found");
      }

      return product;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 상품 리뷰 가져오기
export const fetchProductReviews = createAsyncThunk(
  "products/fetchProductReviews",
  async (productId: string, { rejectWithValue }) => {
    try {
      const constraints = [
        {
          field: "productId",
          operator: "==",
          value: productId,
        },
        {
          orderByField: "createdAt",
          orderDirection: "desc" as const,
        },
      ];

      const reviews = await getCollectionWithMillis<Review>(
        "reviews",
        constraints
      );
      return reviews;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 리뷰 추가하기
export const addReview = createAsyncThunk(
  "products/addReview",
  async (
    {
      productId,
      userId,
      userName,
      userPhoto,
      rating,
      comment,
      photos,
    }: {
      productId: string;
      userId: string;
      userName: string;
      userPhoto?: string;
      rating: number;
      comment: string;
      photos?: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      // 이미 리뷰를 작성했는지 확인
      const existingReviews = await getCollectionWithMillis<Review>("reviews", [
        {
          field: "productId",
          operator: "==",
          value: productId,
        },
        {
          field: "userId",
          operator: "==",
          value: userId,
        },
      ]);

      if (existingReviews.length > 0) {
        throw new Error("You have already reviewed this product");
      }

      // 리뷰 생성
      const review: Omit<Review, "id" | "createdAt"> = {
        productId,
        userId,
        userName,
        rating,
        comment,
      };

      // undefined 필드 제외
      if (userPhoto) review.userPhoto = userPhoto;
      if (photos && photos.length > 0) review.photos = photos;

      const reviewId = await createDocumentWithTimestamp("reviews", review);

      // 상품의 평점 업데이트
      const product = await getDocumentWithMillis<Product>(
        "products",
        productId
      );

      if (!product) {
        throw new Error("Product not found");
      }

      // 현재 리뷰들 가져오기
      const allReviews = await getCollectionWithMillis<Review>("reviews", [
        {
          field: "productId",
          operator: "==",
          value: productId,
        },
      ]);

      // 새로운 평균 평점 계산
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const newRating =
        allReviews.length > 0 ? totalRating / allReviews.length : 0;

      // 상품 평점 업데이트
      await updateDocumentWithTimestamp("products", productId, {
        rating: newRating,
        numReviews: allReviews.length,
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
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 필터 설정
export const setProductFilters = createAsyncThunk(
  "products/setProductFilters",
  async (filters: Partial<ProductsState["filters"]>, { dispatch }) => {
    // 필터 설정 후 상품 다시 가져오기
    dispatch(fetchFilteredProducts());
    return filters;
  }
);

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
