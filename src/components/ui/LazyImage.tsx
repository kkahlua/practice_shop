import { useState, useEffect, useRef } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}

const LazyImage = ({
  src,
  alt,
  className,
  placeholderClassName,
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "100px", // 이미지가 뷰포트에 100px 진입 전에 로드 시작
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div ref={imgRef} className={className || ""}>
      {isInView ? (
        <>
          {!isLoaded && (
            <div
              className={`${
                placeholderClassName || ""
              } skeleton-loader w-full h-full`}
            />
          )}
          <img
            src={src}
            alt={alt}
            className={`${className || ""} ${
              isLoaded ? "opacity-100" : "opacity-0"
            } transition-opacity duration-300`}
            onLoad={handleLoad}
            loading="lazy"
          />
        </>
      ) : (
        <div
          className={`${
            placeholderClassName || ""
          } skeleton-loader w-full h-full`}
        />
      )}
    </div>
  );
};

export default LazyImage;
