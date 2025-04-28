import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  fetchFilteredProducts,
  setFilters,
} from "../../store/slices/productsSlice";
import { X } from "lucide-react";

interface ProductFilterSidebarProps {
  categories: string[];
  isOpen: boolean;
  onClose: () => void;
}

const ProductFilterSidebar = ({
  categories,
  isOpen,
  onClose,
}: ProductFilterSidebarProps) => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state: RootState) => state.products);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    filters.category
  );
  const [priceRange, setPriceRange] = useState<[number, number]>(
    filters.priceRange || [0, 1000]
  );
  const [sortBy, setSortBy] = useState<string>(filters.sortBy);

  useEffect(() => {
    setSelectedCategory(filters.category);
    setPriceRange(filters.priceRange || [0, 50000]);
    setSortBy(filters.sortBy);
  }, [filters]);

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const min = Number(e.target.value);
    setPriceRange([min, priceRange[1]]);
  };

  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = Number(e.target.value);
    setPriceRange([priceRange[0], max]);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const applyFilters = () => {
    // 필터를 Redux 저장소에 설정하고 상품 가져오기
    dispatch(
      setFilters({
        category: selectedCategory,
        priceRange,
        sortBy: sortBy as any,
      })
    );

    // 별도의 액션으로 상품 다시 가져오기
    setTimeout(() => {
      dispatch(fetchFilteredProducts() as any);
    }, 0);

    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setPriceRange([0, 50000]);
    setSortBy("newest");

    // 필터 초기화 및 상품 다시 가져오기
    dispatch(
      setFilters({
        category: null,
        priceRange: null,
        sortBy: "newest",
      })
    );

    // 별도의 액션으로 상품 다시 가져오기
    setTimeout(() => {
      dispatch(fetchFilteredProducts() as any);
    }, 0);
  };

  return (
    <div
      className={`
      fixed md:static inset-0 z-40 bg-white dark:bg-secondary transition-transform duration-300
      md:block md:h-auto md:translate-x-0 md:z-0 md:bg-transparent md:dark:bg-transparent
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
    `}
    >
      {/* Mobile header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 md:hidden">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filters
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-4 h-full md:h-auto overflow-y-auto">
        {/* Sort By */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Sort By
          </h3>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-secondary-light text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="newest">최신순</option>
            <option value="price-asc">가격 낮은순</option>
            <option value="price-desc">가격 높은순</option>
            <option value="rating-desc">별점순</option>
          </select>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            카테고리
          </h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="all-categories"
                name="category"
                checked={selectedCategory === null}
                onChange={() => handleCategoryChange(null)}
                className="w-4 h-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600"
              />
              <label
                htmlFor="all-categories"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                모든 카테고리
              </label>
            </div>

            {categories.map((category) => (
              <div key={category} className="flex items-center">
                <input
                  type="radio"
                  id={`category-${category}`}
                  name="category"
                  checked={selectedCategory === category}
                  onChange={() => handleCategoryChange(category)}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600"
                />
                <label
                  htmlFor={`category-${category}`}
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  {category}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            가격 범위
          </h3>
          <div className="flex items-center justify-between space-x-4">
            <div className="w-1/2">
              <label
                htmlFor="min-price"
                className="block text-xs text-gray-500 dark:text-gray-400 mb-1"
              >
                최소
              </label>
              <input
                type="number"
                id="min-price"
                min={0}
                max={priceRange[1]}
                value={priceRange[0]}
                onChange={handlePriceMinChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-secondary-light text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="w-1/2">
              <label
                htmlFor="max-price"
                className="block text-xs text-gray-500 dark:text-gray-400 mb-1"
              >
                최대
              </label>
              <input
                type="number"
                id="max-price"
                min={priceRange[0]}
                value={priceRange[1]}
                onChange={handlePriceMaxChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-secondary-light text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            {priceRange[0]}원 - {priceRange[1]}원
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex mt-8 space-x-2">
          <button
            onClick={applyFilters}
            className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            적용
          </button>
          <button
            onClick={resetFilters}
            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductFilterSidebar;
