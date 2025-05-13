import { useNavigate } from "react-router-dom";
import { RootState } from "../../store";
import {
  removeFromCart,
  updateCartItemQuantity,
} from "../../store/slices/cartSlice";
import { setModalStatus } from "../../store/slices/uiSlice";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

const CartSidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { items, loading } = useAppSelector((state: RootState) => state.cart);

  const handleRemove = (productId: string) => {
    if (user) {
      dispatch(removeFromCart({ userId: user.id, productId }));
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (user) {
      dispatch(
        updateCartItemQuantity({ userId: user.id, productId, quantity })
      );
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      if (item.product.discountPercentage == null)
        return total + item.product.price * item.quantity;
      return (
        total +
        item.product.price *
          (1 - item.product.discountPercentage / 100) *
          item.quantity
      );
    }, 0);
  };

  const handleCheckout = () => {
    dispatch(setModalStatus({ modal: "cart", status: false }));
    navigate("/checkout");
  };

  const closeCart = () => {
    dispatch(setModalStatus({ modal: "cart", status: false }));
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-secondary shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            장바구니
          </h2>
          <button
            onClick={closeCart}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
            <ShoppingBag
              size={64}
              className="text-gray-300 dark:text-gray-600 mb-4"
            />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              장바구니가 비었어요
            </p>
            <button
              onClick={() => {
                closeCart();
                navigate("/products");
              }}
              className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              쇼핑하기
            </button>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto p-4">
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-4"
                >
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="ml-4 flex-grow">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.product.name}
                    </h3>
                    <div className="flex items-center mt-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        {item.product.discountPercentage === undefined
                          ? item.product.price
                          : item.product.price *
                            (1 - item.product.discountPercentage / 100)}
                        원
                      </span>
                      <span className="mx-2 text-gray-500 dark:text-gray-500">
                        ×
                      </span>
                      <div className="flex items-center">
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity - 1
                            )
                          }
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="mx-2 w-6 text-center text-gray-700 dark:text-gray-300">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity + 1
                            )
                          }
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(item.productId)}
                    className="ml-4 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <X size={20} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {items.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between mb-4">
              <span className="text-gray-600 dark:text-gray-400">합계</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {calculateTotal().toLocaleString("ko-KR")}원
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              결제
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;
