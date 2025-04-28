import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import {
  fetchWishlist,
  removeFromWishlist,
} from "../store/slices/wishlistSlice";
import { addToCart } from "../store/slices/cartSlice";
import { setModalStatus, showToast } from "../store/slices/uiSlice";
import { Heart, ShoppingCart, Trash, X } from "lucide-react";

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: wishlistItems, loading } = useSelector(
    (state: RootState) => state.wishlist
  );

  useEffect(() => {
    if (user) {
      dispatch(fetchWishlist(user.id) as any);
    }
  }, [user, dispatch]);

  const handleRemoveFromWishlist = (productId: string) => {
    if (!user) return;

    dispatch(removeFromWishlist({ userId: user.id, productId }) as any);
    dispatch(showToast({ message: "Removed from wishlist", type: "info" }));
  };

  const handleAddToCart = (productId: string) => {
    if (!user) {
      dispatch(setModalStatus({ modal: "login", status: true }));
      return;
    }

    dispatch(addToCart({ userId: user.id, productId, quantity: 1 }) as any);
    dispatch(showToast({ message: "Added to cart", type: "success" }));
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            좋아요 누른 항목
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            로그인을 해주세요
          </p>
          <button
            onClick={() =>
              dispatch(setModalStatus({ modal: "login", status: true }))
            }
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        좋아요 누른 항목
      </h1>

      {wishlistItems.length === 0 ? (
        <div className="bg-white dark:bg-secondary-light rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <Heart size={64} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
            좋아요 누른 제품이 없어요
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            관심있는 제품을 추가해주세요
          </p>
          <Link
            to="/products"
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition inline-flex items-center"
          >
            쇼핑하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <div
              key={item.productId}
              className="bg-white dark:bg-secondary-light rounded-lg shadow-sm overflow-hidden"
            >
              <div className="relative">
                <Link to={`/products/${item.productId}`}>
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-48 object-cover"
                  />
                </Link>
                <button
                  onClick={() => handleRemoveFromWishlist(item.productId)}
                  className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={18} className="text-red-500" />
                </button>
              </div>

              <div className="p-4">
                <Link
                  to={`/products/${item.productId}`}
                  className="text-lg font-medium text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary transition-colors line-clamp-1"
                >
                  {item.product.name}
                </Link>

                <div className="mt-2 flex items-center">
                  {item.product.discountPercentage ? (
                    <>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {(
                          item.product.price *
                          (1 - item.product.discountPercentage / 100)
                        ).toLocaleString("ko-KR")}
                        원
                      </span>
                      <span className="ml-2 text-sm line-through text-gray-500">
                        {item.product.price.toLocaleString("ko-KR")}원
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.product.price.toLocaleString("ko-KR")}원
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => handleAddToCart(item.productId)}
                    className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg transition flex items-center text-sm font-medium"
                    disabled={item.product.stock <= 0}
                  >
                    <ShoppingCart size={16} className="mr-1" />
                    장바구니 추가
                  </button>

                  <button
                    onClick={() => handleRemoveFromWishlist(item.productId)}
                    className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Remove from wishlist"
                  >
                    <Trash size={18} />
                  </button>
                </div>

                {item.product.stock <= 0 && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    품절
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
