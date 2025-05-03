import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./index";

// 메모이제이션된 선택자 생성
export const selectFilteredProducts = createSelector(
  [
    (state: RootState) => state.products.items,
    (state: RootState) => state.products.filters,
  ],
  (products, filters) => {
    let result = [...products];

    // 카테고리 필터링
    if (filters.category) {
      result = result.filter(
        (product) => product.category === filters.category
      );
    }

    // 가격 범위 필터링
    if (filters.priceRange) {
      result = result.filter(
        (product) =>
          product.price >= filters.priceRange![0] &&
          product.price <= filters.priceRange![1]
      );
    }

    // 검색어 필터링
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower)
      );
    }

    // 정렬 적용
    switch (filters.sortBy) {
      case "price-asc":
        return result.sort((a, b) => a.price - b.price);
      case "price-desc":
        return result.sort((a, b) => b.price - a.price);
      case "rating-desc":
        return result.sort((a, b) => b.rating - a.rating);
      case "newest":
        return result.sort((a, b) => b.createdAt - a.createdAt);
      default:
        return result;
    }
  }
);

// Total Price
export const selectCartTotal = createSelector(
  [(state: RootState) => state.cart.items],
  (items) => {
    return items.reduce((total, item) => {
      const price = item.product.discountPercentage
        ? item.product.price * (1 - item.product.discountPercentage / 100)
        : item.product.price;
      return total + price * item.quantity;
    }, 0);
  }
);
