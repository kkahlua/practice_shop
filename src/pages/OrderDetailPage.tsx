import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { RootState } from "../store";
import { fetchOrderById, cancelOrder } from "../store/slices/ordersSlice";
import { showToast } from "../store/slices/uiSlice";
import { Order, OrderStatus } from "../types";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import {
  ChevronLeft,
  Truck,
  Check,
  MapPin,
  Phone,
  AlertCircle,
  Loader,
  X,
  DollarSign,
} from "lucide-react";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAppDispatch, useAppSelector } from "../store/hooks";

const OrderDetailPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state: RootState) => state.auth);
  const { currentOrder, loading } = useAppSelector(
    (state: RootState) => state.orders
  );

  // 주문 상태를 위한 로컬 상태
  const [order, setOrder] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  // 초기 주문 로드
  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId));
    }
  }, [orderId, dispatch]);

  // 주문 상태 실시간 감시
  useEffect(() => {
    if (orderId) {
      const orderRef = doc(db, "orders", orderId);

      console.log("처리중인 주문번호:", orderId);

      // 실시간 업데이트 구독
      const unsubscribe = onSnapshot(
        orderRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            console.log("Order updated:", docSnapshot.id);
            const data = docSnapshot.data();
            setOrder({
              id: docSnapshot.id,
              ...data,
              createdAt: data.createdAt.toMillis(),
              updatedAt: data.updatedAt.toMillis(),
              userId: data.userId,
              orderItems: data.orderItems,
              totalAmount: data.totalAmount,
              status: data.status,
              shippingAddress: data.shippingAddress,
              contactNumber: data.contactNumber,
              canCancel: data.canCancel,
            } as Order);
          } else {
            console.log("주문 없음");
            setOrder(null);
          }
        },
        (error) => {
          console.error("Error listening to order updates:", error);
        }
      );

      // 컴포넌트 언마운트 시 구독 해제
      return () => {
        unsubscribe();
      };
    }
  }, [orderId]);

  const displayOrder = order || currentOrder;

  const getStatusStepClass = (step: number) => {
    if (!displayOrder) return "bg-gray-300 dark:bg-gray-600";

    const currentStep =
      displayOrder.status === OrderStatus.PAYMENT_COMPLETED
        ? 1
        : displayOrder.status === OrderStatus.SHIPPING
        ? 2
        : 3;

    return step <= currentStep ? "bg-primary" : "bg-gray-300 dark:bg-gray-600";
  };

  const handleCancelOrder = async () => {
    if (!orderId || !displayOrder?.canCancel) return;

    try {
      setIsCancelling(true);
      await dispatch(cancelOrder(orderId));
      dispatch(
        showToast({ message: "주문이 취소되었습니다", type: "success" })
      );
      setShowConfirmCancel(false);
    } catch (error) {
      console.error("Error cancelling order:", error);
      dispatch(
        showToast({ message: "주문 취소에 실패했습니다", type: "error" })
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to="/orders"
          className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary inline-flex items-center"
        >
          <ChevronLeft size={20} className="mr-1" />
          주문 목록으로 돌아가기
        </Link>
      </div>

      {loading && !displayOrder ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      ) : !displayOrder ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            주문을 찾을 수 없습니다.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                주문 상세정보
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                주문번호: #{displayOrder.id.substring(0, 8)} • 주문일:{" "}
                {new Date(displayOrder.createdAt).toLocaleDateString()}
              </p>
            </div>

            {displayOrder.canCancel && (
              <button
                onClick={() => setShowConfirmCancel(true)}
                className="mt-4 md:mt-0 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition flex items-center"
              >
                <X size={18} className="mr-2" />
                주문 취소
              </button>
            )}
          </div>

          {/* 주문 상태 */}
          <div className="bg-white dark:bg-secondary-light rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              주문 상태
            </h2>

            <div className="relative">
              <div className="absolute top-4 left-5 right-5 h-1 bg-gray-200 dark:bg-gray-700"></div>

              <div className="flex justify-between relative">
                <div className="flex flex-col items-center z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusStepClass(
                      1
                    )}`}
                  >
                    <DollarSign size={20} className="text-white" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    결제 완료
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {displayOrder.status === OrderStatus.PAYMENT_COMPLETED
                      ? new Date(displayOrder.createdAt).toLocaleString()
                      : new Date(displayOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-col items-center z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusStepClass(
                      2
                    )}`}
                  >
                    <Truck size={20} className="text-white" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    배송중
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {displayOrder.status === OrderStatus.SHIPPING
                      ? new Date(displayOrder.updatedAt).toLocaleString()
                      : displayOrder.status === OrderStatus.DELIVERED
                      ? new Date(
                          displayOrder.updatedAt - 5000
                        ).toLocaleDateString()
                      : "-"}
                  </p>
                </div>

                <div className="flex flex-col items-center z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusStepClass(
                      3
                    )}`}
                  >
                    <Check size={20} className="text-white" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    배송 완료
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {displayOrder.status === OrderStatus.DELIVERED
                      ? new Date(displayOrder.updatedAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* 주문 상품 */}
              <div className="bg-white dark:bg-secondary-light rounded-lg shadow-sm overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    주문 상품
                  </h2>
                </div>

                <div className="p-6">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {displayOrder.orderItems.map((item, index) => (
                      <li key={index} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="ml-4 flex-grow">
                            <Link
                              to={`/products/${item.productId}`}
                              className="text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary font-medium"
                            >
                              {item.productName}
                            </Link>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              수량: {item.quantity}
                            </p>
                          </div>
                          <div className="ml-4 flex-shrink-0 text-right">
                            <p className="text-gray-900 dark:text-white font-medium">
                              {(item.price * item.quantity).toLocaleString(
                                "ko-KR"
                              )}
                              원
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              개당 {item.price.toLocaleString("ko-KR")}원
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 배송 정보 */}
              <div className="bg-white dark:bg-secondary-light rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    배송 정보
                  </h2>
                </div>

                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:space-x-8">
                    <div className="mb-6 md:mb-0">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        배송지 주소
                      </h3>
                      <div className="flex items-start">
                        <MapPin
                          size={18}
                          className="text-primary mr-2 mt-0.5 flex-shrink-0"
                        />
                        <p className="text-gray-600 dark:text-gray-400">
                          {displayOrder.shippingAddress}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        연락처
                      </h3>
                      <div className="flex items-center">
                        <Phone
                          size={18}
                          className="text-primary mr-2 flex-shrink-0"
                        />
                        <p className="text-gray-600 dark:text-gray-400">
                          {displayOrder.contactNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              {/* 주문 요약 */}
              <div className="bg-white dark:bg-secondary-light rounded-lg shadow-sm overflow-hidden sticky top-24">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    주문 요약
                  </h2>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        합계
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {displayOrder.totalAmount.toLocaleString("ko-KR")}원
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        배송비
                      </span>
                      <span className="text-green-600 dark:text-green-400">
                        Free
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Tax
                      </span>
                      <span className="text-green-600 dark:text-green-400">
                        Free
                      </span>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          Total
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {displayOrder.totalAmount.toLocaleString("ko-KR")}원
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 주문 취소 확인 모달 */}
      {showConfirmCancel && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowConfirmCancel(false)}
            ></div>

            <div className="bg-white dark:bg-secondary rounded-lg shadow-xl max-w-md w-full z-10 p-6">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
                  <AlertCircle
                    size={24}
                    className="text-red-600 dark:text-red-400"
                  />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-4">
                  주문 취소
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  주문을 취소할까요?
                </p>
              </div>

              <div className="flex flex-col sm:flex-row-reverse gap-3">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleCancelOrder}
                  className="w-full sm:w-auto inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isCancelling ? (
                    <>
                      <Loader size={18} className="animate-spin mr-2" />
                      취소 중...
                    </>
                  ) : (
                    "주문 취소하기"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmCancel(false)}
                  className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  주문 유지하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
