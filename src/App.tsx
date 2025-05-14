import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import { RootState } from "./store";
import { lazy, Suspense, useEffect } from "react";
import { setDarkMode } from "./store/slices/uiSlice";
import Toast from "./components/ui/Toast";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import { getDocumentWithMillis } from "./utils/firebaseUtils";
import { User } from "./types";
import { setUser } from "./store/slices/authSlice";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import AddProductPage from "./pages/AddProductPage";
import { useAppDispatch, useAppSelector } from "./store/hooks";

const HomePage = lazy(() => import("./pages/HomePage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const MyReviewsPage = lazy(() => import("./pages/MyReviewsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function App() {
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSelector((state: RootState) => state.ui);

  // 다크모드 설정
  useEffect(() => {
    // 로컬 스토리지에서 다크모드 설정 가져오기
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    dispatch(setDarkMode(savedDarkMode));
  }, [dispatch]);

  // 다크모드 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // 로그인 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 로그인 상태일 때 Firestore에서 사용자 정보 가져오기
        const user = await getDocumentWithMillis<User>(
          "users",
          firebaseUser.uid
        );
        dispatch(setUser(user));
      } else {
        dispatch(setUser(null));
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return (
    <BrowserRouter>
      <div
        className={`min-h-screen transition-colors duration-200 ${
          darkMode ? "dark" : ""
        }`}
      >
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-screen">
              <LoadingSpinner size="large" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route
                path="products/:productId"
                element={<ProductDetailPage />}
              />
              <Route path="cart" element={<CartPage />} />
              <Route
                path="checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="orders"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="orders/:orderId"
                element={
                  <ProtectedRoute>
                    <OrderDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="wishlist"
                element={
                  <ProtectedRoute>
                    <WishlistPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="my-reviews"
                element={
                  <ProtectedRoute>
                    <MyReviewsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="add-product" element={<AddProductPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
        <Toast />
      </div>
    </BrowserRouter>
  );
}

export default App;
