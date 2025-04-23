import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { signOut } from "../../store/slices/authSlice";
import { setModalStatus, toggleDarkMode } from "../../store/slices/uiSlice";
import {
  ShoppingCart,
  Heart,
  User,
  Search,
  Menu,
  X,
  LogOut,
  Package,
  Sun,
  Moon,
  Star,
} from "lucide-react";
import {
  Menu as HeadlessMenu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";

const Navbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { darkMode } = useSelector((state: RootState) => state.ui);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = () => {
    dispatch(signOut() as any);
  };

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

            <button
              onClick={() =>
                dispatch(setModalStatus({ modal: "cart", status: true }))
              }
              className="relative text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
            >
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

            {user ? (
              <HeadlessMenu as="div" className="relative">
                <MenuButton className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-full h-full p-1" />
                    )}
                  </div>
                </MenuButton>
                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-secondary-light rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <MenuItem>
                        {({ active }) => (
                          <Link
                            to="/profile"
                            className={`${
                              active
                                ? "bg-gray-100 dark:bg-gray-700 text-primary"
                                : "text-gray-700 dark:text-gray-300"
                            } flex items-center px-4 py-2 text-sm`}
                          >
                            <User size={16} className="mr-2" />
                            Profile
                          </Link>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <Link
                            to="/orders"
                            className={`${
                              active
                                ? "bg-gray-100 dark:bg-gray-700 text-primary"
                                : "text-gray-700 dark:text-gray-300"
                            } flex items-center px-4 py-2 text-sm`}
                          >
                            <Package size={16} className="mr-2" />
                            My Orders
                          </Link>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <Link
                            to="/my-reviews"
                            className={`${
                              active
                                ? "bg-gray-100 dark:bg-gray-700 text-primary"
                                : "text-gray-700 dark:text-gray-300"
                            } flex items-center px-4 py-2 text-sm`}
                          >
                            <Star size={16} className="mr-2" />
                            My Reviews
                          </Link>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${
                              active
                                ? "bg-gray-100 dark:bg-gray-700 text-primary"
                                : "text-gray-700 dark:text-gray-300"
                            } flex items-center w-full text-left px-4 py-2 text-sm`}
                          >
                            <LogOut size={16} className="mr-2" />
                            Log Out
                          </button>
                        )}
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Transition>
              </HeadlessMenu>
            ) : (
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
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <button
              onClick={() =>
                dispatch(setModalStatus({ modal: "cart", status: true }))
              }
              className="relative text-gray-700 dark:text-gray-300"
            >
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
              {user ? (
                <>
                  <li>
                    <Link
                      to="/profile"
                      className="block text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
                      onClick={toggleMobileMenu}
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/orders"
                      className="block text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
                      onClick={toggleMobileMenu}
                    >
                      My Orders
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/my-reviews"
                      className="block text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
                      onClick={toggleMobileMenu}
                    >
                      My Reviews
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        handleLogout();
                        toggleMobileMenu();
                      }}
                      className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
                    >
                      Log Out
                    </button>
                  </li>
                </>
              ) : (
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
              )}
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
