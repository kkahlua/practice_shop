import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RootState } from "../store";
import { fetchProducts } from "../store/slices/productsSlice";
import { Product } from "../types";
import ProductCard from "../components/products/ProductCard";
import {
  ArrowRight,
  ShoppingBag,
  Truck,
  CreditCard,
  Percent,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import heroImage from "../images/hero-image.png";

const HomePage = () => {
  const dispatch = useAppDispatch();
  const { items: products, loading } = useAppSelector(
    (state: RootState) => state.products
  );
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (products.length > 0) {
      const discounted = [...products]
        .filter((product) => product.discountPercentage)
        .sort(
          (a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0)
        )
        .slice(0, 4);
      setFeaturedProducts(
        discounted.length > 0 ? discounted : products.slice(0, 4)
      );

      const newest = [...products]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 8);
      setNewArrivals(newest);

      const popular = [...products]
        .filter((product) => product.rating > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);
      setBestSellers(popular.length > 0 ? popular : products.slice(0, 4));
    }
  }, [products]);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-secondary dark:to-secondary-light">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
                좋은 가격 좋은 제품 좋은 쇼핑몰 Practice Shop
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                주문하면 제품을 10초만에 배송하는 놀라운 쇼핑몰
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/products"
                  className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center"
                >
                  <ShoppingBag size={20} className="mr-2" />
                  쇼핑하기
                </Link>
                <Link
                  to="/products?category=Electronics"
                  className="bg-white dark:bg-secondary-light hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center border border-gray-200 dark:border-gray-700"
                >
                  전자제품 둘러보기
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src={heroImage}
                alt="Shopping"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-secondary py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 dark:bg-secondary-light rounded-lg p-6 flex items-start">
              <Truck size={24} className="text-primary mr-4 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  빠른 배송
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  주문 후 10초만에 도착
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-secondary-light rounded-lg p-6 flex items-start">
              <Percent size={24} className="text-primary mr-4 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  할인
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  최대 50%까지 할인!
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-secondary-light rounded-lg p-6 flex items-start">
              <CreditCard
                size={24}
                className="text-primary mr-4 flex-shrink-0"
              />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  보안
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Google Firebase의 안전한 보안을 통해 고객님의 정보를
                  지켜드립니다!
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-secondary-light rounded-lg p-6 flex items-start">
              <ShoppingBag
                size={24}
                className="text-primary mr-4 flex-shrink-0"
              />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  품질 보장
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  상품에 하자 있을 시 100% 환불
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 추천상품 Section */}
      <section className="py-16 bg-gray-50 dark:bg-secondary">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              상품이 좋아서 추천드려요
            </h2>
            <Link
              to="/products"
              className="text-primary hover:text-primary-dark font-medium flex items-center"
            >
              더 보기 <ArrowRight size={18} className="ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 신상품 Section */}
      <section className="py-16 bg-white dark:bg-secondary-light">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              새로 들어왔어요!
            </h2>
            <Link
              to="/products?sortBy=newest"
              className="text-primary hover:text-primary-dark font-medium flex items-center"
            >
              더 보기 <ArrowRight size={18} className="ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-16 bg-gray-50 dark:bg-secondary">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Best Sellers
            </h2>
            <Link
              to="/products?sortBy=rating-desc"
              className="text-primary hover:text-primary-dark font-medium flex items-center"
            >
              더 보기 <ArrowRight size={18} className="ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              우리 쇼핑몰을 구독해주세요!
            </h2>
            <p className="text-white text-opacity-90 mb-8">
              이메일로 행사상품의 정보를 받을 수 있어요
            </p>
            <form className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                type="email"
                placeholder="Your email address"
                className="px-4 py-3 rounded-lg flex-grow max-w-md focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                className="bg-white text-primary hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                구독하기
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
