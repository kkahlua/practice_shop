import { memo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { addToCart } from "../../store/slices/cartSlice";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../store/slices/wishlistSlice";
import { setModalStatus, showToast } from "../../store/slices/uiSlice";
import { Product } from "../../types";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import LazyImage from "../ui/LazyImage";
import useIsVisible from "../../hooks/useIsVisible";

interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
}

const useProductUpdates = (productId: string) => {
  const [updatedProduct, setUpdatedProduct] = useState<Partial<Product>>({});

  useEffect(() => {
    const productRef = doc(db, "products", productId);
    const unsubscribe = onSnapshot(productRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setUpdatedProduct({
          rating: data.rating,
          numReviews: data.numReviews,
        });
      }
    });

    return () => unsubscribe();
  }, [productId]);

  return updatedProduct;
};

const ProductCard = ({ product, isWishlisted = false }: ProductCardProps) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [hover, setHover] = useState(false);
  const [liked, setLiked] = useState(isWishlisted);

  const [ref, isVisible] = useIsVisible({
    rootMargin: "200px", // 요소가 화면으로부터 200px 이내로 접근하면 렌더링
  });

  const updatedInfo = useProductUpdates(product.id);
  const displayRating =
    updatedInfo.rating !== undefined ? updatedInfo.rating : product.rating;
  const displayNumReviews =
    updatedInfo.numReviews !== undefined
      ? updatedInfo.numReviews
      : product.numReviews;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      dispatch(setModalStatus({ modal: "login", status: true }));
      return;
    }

    dispatch(
      addToCart({ userId: user.id, productId: product.id, quantity: 1 }) as any
    );
    dispatch(showToast({ message: "장바구니에 담았습니다", type: "success" }));
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      dispatch(setModalStatus({ modal: "login", status: true }));
      return;
    }

    setLiked(!liked);

    if (!liked) {
      dispatch(
        addToWishlist({ userId: user.id, productId: product.id }) as any
      );
      dispatch(
        showToast({
          message: "좋아요 누른 항목에 추가되었습니다",
          type: "success",
        })
      );
    } else {
      dispatch(
        removeFromWishlist({ userId: user.id, productId: product.id }) as any
      );
      dispatch(
        showToast({
          message: "좋아요 누른 항목에서 제거되었습니다",
          type: "info",
        })
      );
    }
  };

  // 가격 계산 및 포맷팅을 위한 유틸리티 함수들
  const calculateDiscountedPrice = (
    originalPrice: number,
    discountPercentage: number | undefined
  ): string => {
    if (discountPercentage === undefined)
      return originalPrice.toLocaleString("ko-KR");
    return (originalPrice * (1 - discountPercentage / 100)).toLocaleString(
      "ko-KR"
    );
  };

  // 제품 가격 처리
  const isDiscount = product.discountPercentage ? true : false;

  const totalPrice = calculateDiscountedPrice(
    product.price,
    product.discountPercentage
  );

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="group relative bg-white dark:bg-secondary-light rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
      onMouseLeave={() => setHover(false)}
    >
      {isVisible ? (
        <>
          <Link to={`/products/${product.id}`} className="block">
            <div className="relative pt-[100%] bg-gray-100 dark:bg-gray-800">
              <LazyImage
                src={product.images[0]}
                alt={product.name}
                className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                placeholderClassName="bg-gray-200 dark:bg-gray-700"
              />

              {/* Wishlist button */}
              <button
                onClick={handleToggleWishlist}
                className={`absolute top-3 right-3 p-2 rounded-full ${
                  liked
                    ? "bg-primary text-white"
                    : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300"
                } shadow-sm transition-colors hover:bg-primary hover:text-white`}
              >
                <Heart size={18} fill={liked ? "currentColor" : "none"} />
              </button>

              {/* Discount tag */}
              {product.discountPercentage && (
                <div className="absolute top-3 left-3 bg-primary text-white px-2 py-1 text-xs font-bold rounded-md">
                  {product.discountPercentage}% OFF
                </div>
              )}

              {/* Add to cart button - visible on hover */}
              <div
                className={`absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-70 transform transition-transform duration-300 ${
                  hover ? "translate-y-0" : "translate-y-full"
                }`}
              >
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
                >
                  <ShoppingCart size={16} className="mr-2" />
                  장바구니에 추가
                </button>
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-base font-medium text-gray-800 dark:text-white truncate">
                {product.name}
              </h3>

              <div className="flex items-center mt-1">
                <div className="flex items-center text-amber-500">
                  <Star size={16} fill="currentColor" />
                  <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                    {displayRating > 0
                      ? displayRating.toFixed(1)
                      : "No ratings"}
                  </span>
                </div>
                <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {displayNumReviews}{" "}
                  {displayNumReviews === 1 ? "review" : "reviews"}
                </span>
              </div>

              <div className="mt-2 flex items-center">
                {isDiscount ? (
                  <>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {totalPrice}원
                    </span>
                    <span className="ml-2 text-sm line-through text-gray-500">
                      {product.price.toLocaleString("ko-KR")}원
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {totalPrice}원
                  </span>
                )}
              </div>

              {product.stock <= 5 && (
                <div className="mt-2 text-xs text-orange-600 dark:text-orange-500 font-medium">
                  {product.stock === 0
                    ? "Out of stock"
                    : `Only ${product.stock} left in stock`}
                </div>
              )}
            </div>
          </Link>
        </>
      ) : (
        <div className="h-80 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      )}
    </div>
  );
};

export default memo(ProductCard);
