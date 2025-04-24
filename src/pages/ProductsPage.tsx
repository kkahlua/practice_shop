import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { fetchProducts, setFilters } from "../store/slices/productsSlice";
import ProductCard from "../components/products/ProductCard";
import ProductFilterSidebar from "../components/products/ProductFilterSidebar";
import { Filter, Grid, List } from "lucide-react";

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

  useEffect(() => {
    dispatch(fetchProducts() as any);
  }, [dispatch]);

  useEffect(() => {
    // Extract unique categories from products
    if (products.length > 0) {
      const uniqueCategories = Array.from(
        new Set(products.map((p) => p.category))
      );
      setCategories(uniqueCategories);
    }
  }, [products]);

  useEffect(() => {
    // Parse query parameters
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("search");
    const sortByParam = searchParams.get("sortBy");

    // Update filters based on query parameters
    const newFilters: any = {};

    if (categoryParam) {
      newFilters.category = categoryParam;
    }

    if (searchParam) {
      newFilters.search = searchParam;
    }

    if (sortByParam) {
      newFilters.sortBy = sortByParam;
    }

    if (Object.keys(newFilters).length > 0) {
      dispatch(setFilters(newFilters));
    }
  }, [location.search, dispatch]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const isProductWishlisted = (productId: string) => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
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

          {/* Mobile Sidebar */}
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

        {/* Products */}
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
                  onClick={() => setViewMode("grid")}
                  className={`p-1 rounded ${
                    viewMode === "grid"
                      ? "bg-primary text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
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
                  onChange={(e) =>
                    dispatch(
                      setFilters({
                        sortBy: e.target.value as
                          | "price-asc"
                          | "price-desc"
                          | "rating-desc"
                          | "newest",
                      })
                    )
                  }
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
          ) : products.length === 0 ? (
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
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={isProductWishlisted(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
