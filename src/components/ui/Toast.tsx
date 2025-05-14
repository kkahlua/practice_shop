import { memo, useEffect } from "react";
import { RootState } from "../../store";
import { hideToast } from "../../store/slices/uiSlice";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

const Toast = () => {
  const dispatch = useAppDispatch();
  const { toast } = useAppSelector((state: RootState) => state.ui);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [toast.show, dispatch]);

  if (!toast.show) {
    return null;
  }

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="text-green-500" />;
      case "error":
        return <AlertCircle className="text-red-500" />;
      case "info":
      default:
        return <Info className="text-blue-500" />;
    }
  };

  const getColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-100 border-green-500 dark:bg-green-900/30 dark:border-green-400";
      case "error":
        return "bg-red-100 border-red-500 dark:bg-red-900/30 dark:border-red-400";
      case "info":
      default:
        return "bg-blue-100 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div
        className={`${getColor()} border-l-4 rounded-md shadow-md p-4 flex items-start`}
      >
        <div className="flex-shrink-0 mr-3 mt-0.5">{getIcon()}</div>
        <div className="flex-grow">
          <p className="text-gray-800 dark:text-gray-200">{toast.message}</p>
        </div>
        <button
          onClick={() => dispatch(hideToast())}
          className="flex-shrink-0 ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default memo(Toast);
