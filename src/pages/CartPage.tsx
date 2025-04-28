import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import {
  fetchCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
} from "../store/slices/cartSlice";
import { setModalStatus } from "../store/slices/uiSlice";
import {
  ShoppingCart,
  Trash,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: cartItems, loading } = useSelector(
    (state: RootState) => state.cart
  );
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    if (user) {
      dispatch(fetchCart(user.id) as any);
    }
  }, [user, dispatch]);

  useEffect(() => {
    // 총 가격 계산
    const total = cartItems.reduce((sum, item) => {
      const price = item.product.discountPercentage
        ? item.product.price * (1 - item.product.discountPercentage / 100)
        : item.product.price;
      return sum + price * item.quantity;
    }, 0);

    setTotalPrice(total);
  }, [cartItems]);

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (!user) return;
    dispatch(
      updateCartItemQuantity({ userId: user.id, productId, quantity }) as any
    );
  };

  const handleRemoveItem = (productId: string) => {
    if (!user) return;
    dispatch(removeFromCart({ userId: user.id, productId }) as any);
  };

  const handleClearCart = () => {
    if (!user) return;
    dispatch(clearCart(user.id) as any);
  };

  const handleCheckout = () => {
    if (!user) {
      dispatch(setModalStatus({ modal: "login", status: true }));
      return;
    }

    if (cartItems.length === 0) return;
    navigate("/checkout");
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            장바구니
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            로그인이 필요해요
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
        장바구니
      </h1>

      {cartItems.length === 0 ? (
        <div className="bg-white dark:bg-secondary-light rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <ShoppingCart
              size={64}
              className="text-gray-300 dark:text-gray-600"
            />
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
            장바구니가 비었어요🥺
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            구매하려는 상품을 장바구니에 넣어보세요
          </p>
          <Link
            to="/products"
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition inline-flex items-center"
          >
            <ShoppingBag size={20} className="mr-2" />
            쇼핑하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-secondary-light rounded-lg shadow-sm overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="col-span-6">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    제품
                  </span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    가격
                  </span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    수량
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    총합
                  </span>
                </div>
              </div>

              {cartItems.map((item) => {
                const price = item.product.discountPercentage
                  ? item.product.price *
                    (1 - item.product.discountPercentage / 100)
                  : item.product.price;

                return (
                  <div
                    key={item.productId}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 items-center"
                  >
                    {/* Product */}
                    <div className="col-span-6 flex items-center">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <Link
                          to={`/products/${item.productId}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary"
                        >
                          {item.product.name}
                        </Link>
                        {item.product.discountPercentage && (
                          <div className="mt-1">
                            <span className="inline-block bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                              {item.product.discountPercentage}% OFF
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="sm:col-span-2 flex justify-between sm:justify-center items-center">
                      <span className="sm:hidden font-medium text-gray-700 dark:text-gray-300">
                        가격:
                      </span>
                      <div>
                        {item.product.discountPercentage ? (
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {price.toLocaleString("ko-KR")}원
                            </span>
                            <span className="ml-2 text-sm line-through text-gray-500">
                              {item.product.price.toLocaleString("ko-KR")}원
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium text-gray-900 dark:text-white">
                            {price.toLocaleString("ko-KR")}원
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2 flex justify-between sm:justify-center items-center">
                      <span className="sm:hidden font-medium text-gray-700 dark:text-gray-300">
                        수량:
                      </span>
                      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity - 1
                            )
                          }
                          className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.product.stock}
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.productId,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-10 text-center border-0 focus:outline-none focus:ring-0 bg-transparent text-gray-700 dark:text-gray-300"
                        />
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity + 1
                            )
                          }
                          className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="sm:col-span-2 flex justify-between sm:justify-end items-center">
                      <span className="sm:hidden font-medium text-gray-700 dark:text-gray-300">
                        총합:
                      </span>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {(price * item.quantity).toLocaleString("ko-KR")}원
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="ml-4 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="p-4 flex justify-between">
                <button
                  onClick={handleClearCart}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center"
                >
                  <Trash size={18} className="mr-2" />
                  장바구니 비우기
                </button>
                <Link
                  to="/products"
                  className="text-primary hover:text-primary-dark font-medium flex items-center"
                >
                  쇼핑하기
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-secondary-light rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                주문 요약
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">합계</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {totalPrice.toLocaleString("ko-KR")}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">배송</span>
                  <span className="text-green-600 dark:text-green-400">
                    Free
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      결제금액
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {totalPrice.toLocaleString("ko-KR")}원
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                결제하기
                <ArrowRight size={18} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
