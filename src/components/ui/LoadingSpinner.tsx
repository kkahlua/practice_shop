import React from "react";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  color = "primary",
  className = "",
}) => {
  // 크기에 따른 클래스 결정
  const sizeClass = {
    small: "h-4 w-4 border-2",
    medium: "h-8 w-8 border-2",
    large: "h-12 w-12 border-b-2",
  }[size];

  // 색상에 따른 클래스 결정
  const colorClass =
    {
      primary: "border-primary",
      white: "border-white",
      gray: "border-gray-300 dark:border-gray-600",
    }[color as "primary" | "white" | "gray"] || "border-primary";

  return (
    <div
      className={`animate-spin rounded-full ${sizeClass} ${colorClass} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">로딩중...</span>
    </div>
  );
};

export default LoadingSpinner;
