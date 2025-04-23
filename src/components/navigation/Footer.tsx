import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Github,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-secondary pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              About Practice Shop
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              결제 완료 후 10초가 지나면 배송완료!
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              결제완료 - 배송 중 - 배송완료
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              결제완료 상태에서만 주문 취소가 가능합니다.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              >
                <Github size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  to="/cart"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                >
                  Cart
                </Link>
              </li>
              <li>
                <Link
                  to="/wishlist"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                >
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Account
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/profile"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                >
                  My Profile
                </Link>
              </li>
              <li>
                <Link
                  to="/orders"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                >
                  My Orders
                </Link>
              </li>
              <li>
                <Link
                  to="/wishlist"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                >
                  My Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin
                  className="text-primary mr-2 mt-1 flex-shrink-0"
                  size={18}
                />
                <span className="text-gray-600 dark:text-gray-400">
                  대전광역시
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="text-primary mr-2 flex-shrink-0" size={18} />
                <span className="text-gray-600 dark:text-gray-400">
                  010-1234-1234
                </span>
              </li>
              <li className="flex items-center">
                <Mail className="text-primary mr-2 flex-shrink-0" size={18} />
                <span className="text-gray-600 dark:text-gray-400">
                  practiceshop@naver.com
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Practice Shop
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
