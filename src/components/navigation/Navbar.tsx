import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { ShoppingCart, Heart, Search, Menu, X, Sun, Moon } from "lucide-react";
import { setModalStatus, toggleDarkMode } from "../../store/slices/uiSlice";

const Navbar = () => {
  const dispatch = useDispatch();

  const { darkMode } = useSelector((state: RootState) => state.ui);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-secondary shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary dark:text-primary">
              Practice Shop
            </span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:block flex-grow max-w-2xl mx-8">
            <form className="relative">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full py-2 px-4 rounded-lg bg-gray-100 dark:bg-secondary-light focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
              >
                <Search size={20} />
              </button>
            </form>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => dispatch(toggleDarkMode())}
              className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>

            <Link
              to="/products"
              className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
            >
              Products
            </Link>

            <button className="relative text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition">
              <ShoppingCart size={24} />
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                ?
              </span>
            </button>

            <Link
              to="/wishlist"
              className="relative text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
            >
              <Heart size={24} />
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                ?
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <button
                onClick={() =>
                  dispatch(setModalStatus({ modal: "login", status: true }))
                }
                className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
              >
                Log In
              </button>
              <button
                onClick={() =>
                  dispatch(setModalStatus({ modal: "signup", status: true }))
                }
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition"
              >
                Sign Up
              </button>
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <button className="relative text-gray-700 dark:text-gray-300">
              <ShoppingCart size={24} />
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                ?
              </span>
            </button>
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 dark:text-gray-300"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search - Always visible */}
        <div className="mt-4 md:hidden">
          <form className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full py-2 px-4 rounded-lg bg-gray-100 dark:bg-secondary-light focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
            >
              <Search size={20} />
            </button>
          </form>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <ul className="space-y-4">
              <li>
                <Link
                  to="/products"
                  className="block text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
                  onClick={toggleMobileMenu}
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  to="/wishlist"
                  className="block text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
                  onClick={toggleMobileMenu}
                >
                  Wishlist
                </Link>
              </li>

              <>
                <li>
                  <button
                    onClick={() => {
                      dispatch(
                        setModalStatus({ modal: "login", status: true })
                      );
                      toggleMobileMenu();
                    }}
                    className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
                  >
                    Log In
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      dispatch(
                        setModalStatus({ modal: "signup", status: true })
                      );
                      toggleMobileMenu();
                    }}
                    className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
                  >
                    Sign Up
                  </button>
                </li>
              </>

              <li>
                <button
                  onClick={() => {
                    dispatch(toggleDarkMode());
                    toggleMobileMenu();
                  }}
                  className="flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
                >
                  {darkMode ? (
                    <Sun size={20} className="mr-2" />
                  ) : (
                    <Moon size={20} className="mr-2" />
                  )}
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
