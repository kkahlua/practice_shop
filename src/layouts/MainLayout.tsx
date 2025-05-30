import { Outlet } from "react-router-dom";
import Navbar from "../components/navigation/Navbar";
import Footer from "../components/navigation/Footer";
import { RootState } from "../store";
import LoginModal from "../components/auth/LoginModal";
import SignupModal from "../components/auth/SignupModal";
import CartSidebar from "../components/cart/CartSidebar";
import { useAppSelector } from "../store/hooks";

const MainLayout = () => {
  const { modals } = useAppSelector((state: RootState) => state.ui);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-background-dark">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      {/* Modals */}
      {modals.login && <LoginModal />}
      {modals.signup && <SignupModal />}
      {modals.cart && <CartSidebar />}
    </div>
  );
};

export default MainLayout;
