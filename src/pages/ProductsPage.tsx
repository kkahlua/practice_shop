import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import {
  fetchProducts,
  setFilters,
  fetchFilteredProducts,
} from "../store/slices/productsSlice";
import ProductCard from "../components/products/ProductCard";
import ProductFilterSidebar from "../components/products/ProductFilterSidebar";
import { Filter, Grid, List } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";

const ProductsPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const {
    items: products,
    loading,
    filters,
  } = useSelector((state: RootState) => state.products);
  const { items: wishlistItems } = useSelector(
    (state: RootState) => state.wishlist
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [categories, setCategories] = useState<string[]>([]);

  // 검색어 디바운싱
  const debouncedFilters = useDebounce(filters, 300);

  // 제품 목록 초기 로드
  useEffect(() => {
    dispatch(fetchProducts() as any);
  }, [dispatch]);

  // 카테고리 목록 추출
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = Array.from(
        new Set(products.map((p) => p.category))
      );
      setCategories(uniqueCategories);
    }
  }, [products]);

  // URL 쿼리 파라미터에서 필터 정보 추출
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("search");
    const sortByParam = searchParams.get("sortBy");

    const newFilters: any = {};
    let hasChanges = false;

    if (categoryParam && categoryParam !== filters.category) {
      newFilters.category = categoryParam;
      hasChanges = true;
    }

    if (searchParam && searchParam !== filters.search) {
      newFilters.search = searchParam;
      hasChanges = true;
    }

    if (sortByParam && sortByParam !== filters.sortBy) {
      newFilters.sortBy = sortByParam as any;
      hasChanges = true;
    }

    if (hasChanges) {
      dispatch(setFilters(newFilters));
    }
  }, [location.search, dispatch, filters]);

  // 디바운스된 필터로 상품 가져오기
  useEffect(() => {
    dispatch(fetchFilteredProducts() as any);
  }, [debouncedFilters, dispatch]);

  // 필터링 및 정렬된 상품 목록 메모이제이션
  const filteredProducts = useMemo(() => {
    // 로딩 중이거나 상품이 없으면 빈 배열 반환
    if (loading || products.length === 0) return [];

    // 클라이언트 측 필터링 (서버 필터링이 부족한 경우 추가)
    let result = [...products];

    // 검색어로 추가 필터링 (더 정확한 결과를 위해)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower)
      );
    }

    // 카테고리로 추가 필터링 (서버 필터링이 정확하지 않은 경우)
    if (filters.category) {
      result = result.filter(
        (product) => product.category === filters.category
      );
    }

    return result;
  }, [products, filters.search, filters.category, loading]);

  // 사이드바 토글 핸들러 메모이제이션
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // 위시리스트 체크 함수 메모이제이션
  const isProductWishlisted = useCallback(
    (productId: string) => {
      return wishlistItems.some((item) => item.productId === productId);
    },
    [wishlistItems]
  );

  // 뷰 모드 변경 핸들러 메모이제이션
  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
  }, []);

  // 정렬 변경 핸들러 메모이제이션
  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const sortValue = e.target.value as
        | "newest"
        | "price-asc"
        | "price-desc"
        | "rating-desc";
      dispatch(setFilters({ sortBy: sortValue }));
    },
    [dispatch]
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* 사이드바 */}
        <div className="md:w-1/4 lg:w-1/5">
          <div className="md:hidden mb-4">
            <button
              onClick={toggleSidebar}
              className="w-full bg-white dark:bg-secondary-light border border-gray-300 dark:border-gray-700 rounded-lg py-2 px-4 flex items-center justify-center text-gray-700 dark:text-gray-300"
            >
              <Filter size={20} className="mr-2" />
              검색필터
            </button>
          </div>

          <div className="hidden md:block">
            <ProductFilterSidebar
              categories={categories}
              isOpen={true}
              onClose={() => {}}
            />
          </div>

          {/* 모바일 사이드바 */}
          {sidebarOpen && (
            <div className="md:hidden">
              <ProductFilterSidebar
                categories={categories}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
            </div>
          )}
        </div>

        {/* 상품 목록 */}
        <div className="md:w-3/4 lg:w-4/5">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
              모든 제품
              {filters.category && (
                <span className="text-primary ml-2">• {filters.category}</span>
              )}
              {filters.search && (
                <span className="text-primary ml-2">• "{filters.search}"</span>
              )}
            </h1>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white dark:bg-secondary-light border border-gray-300 dark:border-gray-700 rounded-lg p-1">
                <button
                  onClick={() => handleViewModeChange("grid")}
                  className={`p-1 rounded ${
                    viewMode === "grid"
                      ? "bg-primary text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => handleViewModeChange("list")}
                  className={`p-1 rounded ${
                    viewMode === "list"
                      ? "bg-primary text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <List size={20} />
                </button>
              </div>

              <div className="hidden sm:block">
                <select
                  value={filters.sortBy}
                  onChange={handleSortChange}
                  className="bg-white dark:bg-secondary-light border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="newest">최신순</option>
                  <option value="price-asc">가격 낮은순</option>
                  <option value="price-desc">가격 높은순</option>
                  <option value="rating-desc">별점순</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                조건에 맞는 상품이 없어요 다른 조건으로 검색해보세요😄
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-6"
              }
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={isProductWishlisted(product.id)}
                />
              ))}
            </div>
          )}

          {/* 결과가 없을 때 표시할 메시지 */}
          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                조건에 맞는 상품이 없어요 다른 조건으로 검색해보세요😄
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
