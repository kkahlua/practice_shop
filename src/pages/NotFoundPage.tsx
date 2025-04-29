import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-lg mx-auto bg-white dark:bg-secondary-light rounded-lg shadow-sm p-8 text-center">
        <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          찾으려는 페이지가 존재하지 않아요
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Link
            to="/"
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition flex items-center justify-center"
          >
            <Home size={18} className="mr-2" />
            Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-6 rounded-lg transition flex items-center justify-center"
          >
            <ArrowLeft size={18} className="mr-2" />
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
