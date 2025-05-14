import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RootState } from "../store";
import { fetchCart, clearCart } from "../store/slices/cartSlice";
import { createOrder } from "../store/slices/ordersSlice";
import { showToast } from "../store/slices/uiSlice";
import { OrderItem } from "../types";
import { CreditCard, Loader, Check } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { items: cartItems, loading: cartLoading } = useAppSelector(
    (state: RootState) => state.cart
  );
  const { loading: orderLoading } = useAppSelector(
    (state: RootState) => state.orders
  );

  const [formData, setFormData] = useState({
    fullName: user?.displayName || "",
    email: user?.email || "",
    postalCode: "", // 우편번호
    address1: "", // 기본 주소 (시/도, 구/군, 동/읍/면)
    address2: "", // 상세 주소 (건물명, 동/호수 등)
    phoneNumber: user?.phoneNumber || "",
    paymentMethod: "credit_card",
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
  });

  const [totalPrice, setTotalPrice] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchCart(user.id));
    } else {
      navigate("/login");
    }
  }, [user, dispatch, navigate]);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || cartItems.length === 0) return;

    // 모의 결제 처리
    try {
      setIsProcessing(true);

      // 2초 지연 (모의 결제 처리)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 주문 아이템 준비
      const orderItems: OrderItem[] = cartItems.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.images[0],
        quantity: item.quantity,
        price: item.product.discountPercentage
          ? item.product.price * (1 - item.product.discountPercentage / 100)
          : item.product.price,
      }));

      // 주문 생성
      await dispatch(
        createOrder({
          userId: user.id,
          orderItems,
          totalAmount: totalPrice,
          shippingAddress: `${formData.address1}, ${formData.address2}`,
          contactNumber: formData.phoneNumber,
        })
      );

      // 장바구니 비우기
      await dispatch(clearCart(user.id));

      setIsPaymentComplete(true);
      dispatch(showToast({ message: "주문 완료", type: "success" }));

      // 3초 후 주문 페이지로 이동
      setTimeout(() => {
        navigate("/orders");
      }, 3000);
    } catch (error) {
      console.error("Payment error:", error);
      dispatch(
        showToast({
          message: "결제 실패",
          type: "error",
        })
      );
      setIsProcessing(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (cartItems.length === 0 && !isPaymentComplete) {
    navigate("/cart");
    return null;
  }

  if (isPaymentComplete) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto bg-white dark:bg-secondary-light rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            결제완료
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            결제가 완료되었어요! 주문 페이지로 이동 중입니다...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        결제
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Shipping Information */}
            <div className="bg-white dark:bg-secondary-light rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                배송 정보
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    이름
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    이메일
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary dark:text-white"
                  />
                </div>

                {/* 우편번호 입력 */}
                <div className="flex space-x-2">
                  <div className="flex-grow">
                    <label
                      htmlFor="postalCode"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      우편번호
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      required
                      maxLength={5}
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary dark:text-white"
                    />
                  </div>
                </div>

                {/* 기본주소 */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="address1"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    기본 주소
                  </label>
                  <input
                    type="text"
                    id="address1"
                    name="address1"
                    required
                    value={formData.address1}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary dark:text-white"
                    placeholder="시/도, 구/군, 동/읍/면"
                  />
                </div>

                {/* 상세주소 */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="address2"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    상세 주소
                  </label>
                  <input
                    type="text"
                    id="address2"
                    name="address2"
                    required
                    value={formData.address2}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary dark:text-white"
                    placeholder="건물명, 동/호수 등"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    연락처
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    required
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary dark:text-white"
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white dark:bg-secondary-light rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                결제 정보
              </h2>

              <div className="mb-4">
                <div className="flex items-center mb-4">
                  <input
                    type="radio"
                    id="credit_card"
                    name="paymentMethod"
                    value="credit_card"
                    checked={formData.paymentMethod === "credit_card"}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600"
                  />
                  <label
                    htmlFor="credit_card"
                    className="ml-2 text-gray-700 dark:text-gray-300"
                  >
                    신용카드
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label
                    htmlFor="cardNumber"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    카드 번호
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    required
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="cardHolder"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    소유자 이름
                  </label>
                  <input
                    type="text"
                    id="cardHolder"
                    name="cardHolder"
                    required
                    value={formData.cardHolder}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="expiryDate"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    만료일
                  </label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    required
                    placeholder="MM/YY"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cvv"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    CVV
                  </label>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    required
                    placeholder="123"
                    value={formData.cvv}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary dark:text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || orderLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing || orderLoading ? (
                <>
                  <Loader size={20} className="animate-spin mr-2" />
                  결제중...
                </>
              ) : (
                <>
                  <CreditCard size={20} className="mr-2" />
                  {totalPrice.toLocaleString("ko-KR")}원 결제하기
                </>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-secondary-light rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              주문 요약
            </h2>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                상품 ({cartItems.length})
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-3">
                {cartItems.map((item) => {
                  const price = item.product.discountPercentage
                    ? item.product.price *
                      (1 - item.product.discountPercentage / 100)
                    : item.product.price;

                  return (
                    <div key={item.productId} className="flex items-start">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-3 flex-grow">
                        <p className="text-sm text-gray-900 dark:text-white line-clamp-1">
                          {item.product.name}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            수량: {item.quantity}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {(price * item.quantity).toLocaleString("ko-KR")}원
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">합계</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {totalPrice.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">배송료</span>
                <span className="text-green-600 dark:text-green-400">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span className="text-green-600 dark:text-green-400">Free</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  결제금액
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {totalPrice.toLocaleString("ko-KR")}원
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CheckoutPage;
