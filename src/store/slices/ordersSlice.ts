import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Order, OrderStatus, OrderItem } from "../../types";
import {
  getCollectionWithMillis,
  getDocumentWithMillis,
  createDocumentWithTimestamp,
  updateDocumentWithTimestamp,
  QueryConstraint,
} from "../../utils/firebaseUtils";

interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

// 사용자 주문 목록 가져오기
export const fetchUserOrders = createAsyncThunk<Order[], string>(
  "orders/fetchUserOrders",
  async (userId, { rejectWithValue }) => {
    try {
      const constraints: QueryConstraint[] = [
        {
          field: "userId",
          operator: "==",
          value: userId,
        },
        {
          orderByField: "createdAt",
          orderDirection: "desc",
        },
      ];

      const orders = await getCollectionWithMillis<Order>(
        "orders",
        constraints
      );
      return orders;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

// 특정 주문 가져오기
export const fetchOrderById = createAsyncThunk<Order, string>(
  "orders/fetchOrderById",
  async (orderId, { rejectWithValue }) => {
    try {
      const order = await getDocumentWithMillis<Order>("orders", orderId);

      if (!order) {
        throw new Error("Order not found");
      }

      return order;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

// 주문 생성하기
export const createOrder = createAsyncThunk<
  Order,
  {
    userId: string;
    orderItems: OrderItem[];
    totalAmount: number;
    shippingAddress: string;
    contactNumber: string;
  }
>(
  "orders/createOrder",
  async (
    { userId, orderItems, totalAmount, shippingAddress, contactNumber },
    { rejectWithValue }
  ) => {
    try {
      // 주문 생성
      const newOrder: Omit<Order, "id" | "createdAt" | "updatedAt"> = {
        userId,
        orderItems,
        totalAmount,
        status: OrderStatus.PAYMENT_COMPLETED,
        shippingAddress,
        contactNumber,
        canCancel: true,
      };

      // Firestore에 저장
      const orderId = await createDocumentWithTimestamp("orders", newOrder);

      // 주문 상태 변경 타이머 설정
      setTimeout(async () => {
        try {
          await updateDocumentWithTimestamp("orders", orderId, {
            status: OrderStatus.SHIPPING,
            canCancel: false,
          });

          // 배송 완료 상태로 변경
          setTimeout(async () => {
            try {
              await updateDocumentWithTimestamp("orders", orderId, {
                status: OrderStatus.DELIVERED,
              });
            } catch (err) {
              console.error("Error updating order to DELIVERED:", err);
            }
          }, 5000); // 5초 후 배송 완료
        } catch (err) {
          console.error("Error updating order to SHIPPING:", err);
        }
      }, 5000); // 5초 후 배송중 상태로 변경

      // 생성된 주문 반환
      const createdOrder = await getDocumentWithMillis<Order>(
        "orders",
        orderId
      );

      if (!createdOrder) {
        throw new Error("Failed to retrieve created order");
      }

      return createdOrder;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

// 주문 취소하기
export const cancelOrder = createAsyncThunk<Order, string>(
  "orders/cancelOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const order = await getDocumentWithMillis<Order>("orders", orderId);

      if (!order) {
        throw new Error("Order not found");
      }

      if (!order.canCancel) {
        throw new Error("This order cannot be canceled");
      }

      // 주문 취소 처리
      await updateDocumentWithTimestamp("orders", orderId, {
        status: OrderStatus.PAYMENT_COMPLETED,
        canCancel: false,
      });

      // 업데이트된 주문 반환
      const updatedOrder = await getDocumentWithMillis<Order>(
        "orders",
        orderId
      );

      if (!updatedOrder) {
        throw new Error("Failed to retrieve updated order");
      }

      return updatedOrder;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("알 수 없는 오류가 발생했습니다.");
    }
  }
);

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Order By Id
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        state.orders = [action.payload, ...state.orders];
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Cancel Order
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;

        // 주문 목록에서도 업데이트
        const index = state.orders.findIndex(
          (order) => order.id === action.payload.id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
