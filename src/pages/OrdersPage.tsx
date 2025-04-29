import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { fetchUserOrders } from "../store/slices/ordersSlice";
import { OrderStatus } from "../types";
import {
  Package,
  Clock,
  Truck,
  Check,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PAYMENT_COMPLETED:
      return <Clock size={20} className="text-blue-500" />;
    case OrderStatus.SHIPPING:
      return <Truck size={20} className="text-orange-500" />;
    case OrderStatus.DELIVERED:
      return <Check size={20} className="text-green-500" />;
    default:
      return <AlertCircle size={20} className="text-gray-500" />;
  }
};

const getStatusText = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PAYMENT_COMPLETED:
      return "결제 완료";
    case OrderStatus.SHIPPING:
      return "배송중";
    case OrderStatus.DELIVERED:
      return "배송완료";
    default:
      return "Unknown Status";
  }
};

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PAYMENT_COMPLETED:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case OrderStatus.SHIPPING:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case OrderStatus.DELIVERED:
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

const OrdersPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { orders, loading } = useSelector((state: RootState) => state.orders);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserOrders(user.id) as any);
    }
  }, [user, dispatch]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            로그인
          </h1>
          <p className="text-gray-600 dark:text-gray-400">로그인이 필요해요</p>
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
        주문 목록
      </h1>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-secondary-light rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <Package size={64} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
            아직 주문한 내역이 없어요
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            원하는 상품을 주문하러 떠나볼까요?
          </p>
          <Link
            to="/products"
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition inline-flex items-center"
          >
            쇼핑하기
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-secondary-light rounded-lg shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between md:items-center">
                  <div className="mb-4 md:mb-0">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Order #{order.id.substring(0, 8)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      주문 날짜:{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      <span className="ml-1">
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    <Link
                      to={`/orders/${order.id}`}
                      className="text-primary hover:text-primary-dark font-medium text-sm flex items-center"
                    >
                      자세히 보기
                      <ChevronRight size={16} className="ml-1" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      상품
                    </h3>

                    <div className="space-y-4">
                      {order.orderItems.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-start">
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
                              수량: {item.quantity} x ${item.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}

                      {order.orderItems.length > 3 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                          +{order.orderItems.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      주문 요약
                    </h3>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            전체 상품
                          </span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {order.totalAmount.toLocaleString("ko-KR")}원
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            배송
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            Free
                          </span>
                        </div>
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                          <span className="font-medium text-gray-900 dark:text-white">
                            Total
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {order.totalAmount.toLocaleString("ko-KR")}원
                          </span>
                        </div>
                      </div>
                    </div>

                    {order.canCancel && (
                      <div className="mt-4">
                        <Link
                          to={`/orders/${order.id}`}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center"
                        >
                          주문 취소
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
