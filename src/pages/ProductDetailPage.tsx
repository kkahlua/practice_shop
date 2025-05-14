import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { RootState } from "../store";
import { fetchProductById, addReview } from "../store/slices/productsSlice";
import { addToCart } from "../store/slices/cartSlice";
import {
  addToWishlist,
  removeFromWishlist,
} from "../store/slices/wishlistSlice";
import { setModalStatus, showToast } from "../store/slices/uiSlice";
import {
  ShoppingCart,
  Heart,
  Star,
  ChevronRight,
  Minus,
  Plus,
  Upload,
  Info,
  Check,
} from "lucide-react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Product, Review } from "../types";
import { useAppDispatch, useAppSelector } from "../store/hooks";

// 리뷰 제출 데이터 인터페이스 정의
interface ReviewSubmitData {
  productId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  photos?: string[];
}

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state: RootState) => state.auth);
  const { currentProduct, reviews, loading, error } = useAppSelector(
    (state: RootState) => state.products
  );
  const { items: wishlistItems } = useAppSelector(
    (state: RootState) => state.wishlist
  );
  const { items: cartItems } = useAppSelector((state: RootState) => state.cart);
  const { orders } = useAppSelector((state: RootState) => state.orders);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: "",
    photos: [] as File[],
  });
  const [reviewPhotoPreviews, setReviewPhotoPreviews] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (productId) {
      dispatch(fetchProductById(productId));
      // dispatch(fetchProductReviews(productId)); - 이 부분 제거
    }
  }, [productId, dispatch]);

  useEffect(() => {
    if (productId) {
      // Firestore 리스너 설정
      const unsubscribeProduct = onSnapshot(
        doc(db, "products", productId),
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const productData = docSnapshot.data();
            const updatedProduct = {
              id: docSnapshot.id,
              ...productData,
              createdAt: productData.createdAt.toMillis(),
              updatedAt: productData.updatedAt.toMillis(),
            } as Product;

            dispatch({
              type: "products/updateCurrentProduct",
              payload: updatedProduct,
            });
          }
        }
      );

      const reviewsQuery = query(
        collection(db, "reviews"),
        where("productId", "==", productId),
        orderBy("createdAt", "desc")
      );

      const unsubscribeReviews = onSnapshot(reviewsQuery, (querySnapshot) => {
        const reviewsList: Review[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();

          // Review 타입 구조에 맞춰 데이터 매핑
          const reviewData: Review = {
            id: doc.id,
            productId: data.productId,
            userId: data.userId,
            userName: data.userName,
            rating: data.rating,
            comment: data.comment,
            createdAt: data.createdAt.toMillis(),
          };

          // updatedAt이 존재하면 추가
          if (data.updatedAt) {
            reviewData.updatedAt = data.updatedAt.toMillis();
          }

          // 선택적 속성 추가
          if (data.userPhoto) reviewData.userPhoto = data.userPhoto;
          if (data.photos) reviewData.photos = data.photos;

          reviewsList.push(reviewData);
        });

        dispatch({ type: "products/updateReviews", payload: reviewsList });
      });

      return () => {
        unsubscribeProduct();
        unsubscribeReviews();
      };
    }
  }, [productId, dispatch]);

  useEffect(() => {
    // wishlist에 product 있는지 확인
    if (wishlistItems.length > 0 && productId) {
      const isLiked = wishlistItems.some(
        (item) => item.productId === productId
      );
      setLiked(isLiked);
    }
  }, [wishlistItems, productId]);

  useEffect(() => {
    // 사용자가 product 구매했는지 확인
    if (user && orders.length > 0 && productId) {
      const hasPurchased = orders.some((order) =>
        order.orderItems.some((item) => item.productId === productId)
      );
      setShowReviewForm(hasPurchased);
    } else {
      setShowReviewForm(false);
    }
  }, [user, orders, productId]);

  const handleQuantityChange = (value: number) => {
    if (value < 1) return;
    if (currentProduct && value > currentProduct.stock) return;
    setQuantity(value);
  };

  const handleAddToCart = () => {
    if (!user) {
      dispatch(setModalStatus({ modal: "login", status: true }));
      return;
    }

    if (productId) {
      dispatch(addToCart({ userId: user.id, productId, quantity }));
      dispatch(showToast({ message: "장바구니에 담았어요", type: "success" }));
    }
  };

  const handleToggleWishlist = () => {
    if (!user) {
      dispatch(setModalStatus({ modal: "login", status: true }));
      return;
    }

    if (!productId) return;

    setLiked(!liked);

    if (!liked) {
      dispatch(addToWishlist({ userId: user.id, productId }));
      dispatch(
        showToast({
          message: "좋아요 누른 항목에 추가되었습니다",
          type: "success",
        })
      );
    } else {
      dispatch(removeFromWishlist({ userId: user.id, productId }));
      dispatch(
        showToast({
          message: "좋아요 누른 항목에서 제거되었습니다",
          type: "info",
        })
      );
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !currentProduct || !productId) return;

    try {
      setIsSubmittingReview(true);

      const photoUrls: string[] = [];

      // 사진 있으면 업로드
      if (reviewData.photos.length > 0) {
        const storage = getStorage();

        for (const photo of reviewData.photos) {
          // 스토리지 경로 수정 - 공유 폴더에 저장
          const fileRef = ref(
            storage,
            `review-images/${Date.now()}_${photo.name}`
          );
          await uploadBytes(fileRef, photo);
          const downloadUrl = await getDownloadURL(fileRef);
          photoUrls.push(downloadUrl);
        }
      }

      const reviewSubmitData: ReviewSubmitData = {
        productId,
        userId: user.id,
        userName: user.displayName,
        rating: reviewData.rating,
        comment: reviewData.comment,
      };

      // 사용자 프로필 사진이 있을 경우만 추가
      if (user.photoURL) {
        reviewSubmitData.userPhoto = user.photoURL;
      }

      // 리뷰 사진이 있을 경우만 추가
      if (photoUrls.length > 0) {
        reviewSubmitData.photos = photoUrls;
      }

      // Add review
      await dispatch(addReview(reviewSubmitData));

      // Reset form
      setReviewData({
        rating: 5,
        comment: "",
        photos: [],
      });
      setReviewPhotoPreviews([]);

      dispatch(showToast({ message: "리뷰 작성 완료", type: "success" }));
    } catch (error) {
      console.error("Error submitting review:", error);
      dispatch(showToast({ message: "리뷰 작성 실패", type: "error" }));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    if (reviewData.photos.length + files.length > 3) {
      dispatch(
        showToast({
          message: "이미지는 최대 3장 전송할 수 있습니다",
          type: "error",
        })
      );
      return;
    }

    setReviewData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...files],
    }));

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setReviewPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    setReviewData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));

    // 메모리 누수 방지
    URL.revokeObjectURL(reviewPhotoPreviews[index]);
    setReviewPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading && !currentProduct) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !currentProduct) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            제품이 없습니다
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            원하시는 상품은 최대한 빨리 제공하도록 노력하겠습니다😢
          </p>
          <Link
            to="/products"
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            다른 제품 살펴보기
          </Link>
        </div>
      </div>
    );
  }

  // 할인된 가격 계산
  const discountedPrice = currentProduct.discountPercentage
    ? currentProduct.price * (1 - currentProduct.discountPercentage / 100)
    : null;

  // 현재 상품이 장바구니에 있는지 확인
  const isInCart = cartItems.some(
    (item) => item.productId === currentProduct.id
  );

  // 사용자가 리뷰를 작성했는지 확인
  const hasReviewed =
    user && reviews.some((review) => review.userId === user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-primary dark:hover:text-primary">
          Home
        </Link>
        <ChevronRight size={16} className="mx-1" />
        <Link
          to="/products"
          className="hover:text-primary dark:hover:text-primary"
        >
          Products
        </Link>
        <ChevronRight size={16} className="mx-1" />
        <Link
          to={`/products?category=${currentProduct.category}`}
          className="hover:text-primary dark:hover:text-primary"
        >
          {currentProduct.category}
        </Link>
        <ChevronRight size={16} className="mx-1" />
        <span className="text-gray-700 dark:text-gray-300 truncate">
          {currentProduct.name}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Product Images */}
        <div>
          <div className="mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <img
              src={currentProduct.images[activeImage]}
              alt={currentProduct.name}
              className="w-full h-96 object-contain"
            />
          </div>

          {currentProduct.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {currentProduct.images.map((image, index) => (
                <div
                  key={`product-image-${index}`}
                  className={`cursor-pointer border-2 rounded-md overflow-hidden ${
                    activeImage === index
                      ? "border-primary"
                      : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  onClick={() => setActiveImage(index)}
                >
                  <img
                    src={image}
                    alt={`${currentProduct.name} - ${index + 1}`}
                    className="w-full h-20 object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {currentProduct.name}
          </h1>

          <div className="flex items-center mb-4">
            <div className="flex items-center text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={`product-rating-${star}`}
                  size={20}
                  fill={currentProduct.rating >= star ? "currentColor" : "none"}
                  className={
                    currentProduct.rating >= star
                      ? "text-amber-500"
                      : "text-gray-300 dark:text-gray-600"
                  }
                />
              ))}
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {currentProduct.rating > 0
                  ? `${currentProduct.rating.toFixed(1)} (${
                      currentProduct.numReviews
                    } reviews)`
                  : "0.0"}
              </span>
            </div>
          </div>

          <div className="mb-6">
            {discountedPrice ? (
              <div className="flex items-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {discountedPrice.toLocaleString("ko-KR")}원
                </span>
                <span className="ml-3 text-xl line-through text-gray-500">
                  {currentProduct.price.toLocaleString("ko-KR")}원
                </span>
                <span className="ml-3 px-2 py-1 bg-primary text-white text-sm font-bold rounded-md">
                  {currentProduct.discountPercentage}% OFF
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {currentProduct.price.toLocaleString("ko-KR")}원
              </span>
            )}
          </div>

          <div className="prose prose-gray dark:prose-invert mb-6">
            <p className="text-gray-600 dark:text-gray-300">
              {currentProduct.description}
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                재고:
              </span>
              {currentProduct.stock > 0 ? (
                <span className="text-green-600 dark:text-green-500 flex items-center">
                  <Check size={16} className="mr-1" />
                  상품이 ({currentProduct.stock}개 남았어요)
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-500">품절</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                Category:
              </span>
              <Link
                to={`/products?category=${currentProduct.category}`}
                className="text-primary hover:text-primary-dark"
              >
                {currentProduct.category}
              </Link>
            </div>
          </div>

          {currentProduct.stock > 0 && (
            <div className="mb-6">
              <div className="flex items-center">
                <div className="mr-4">
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    수량
                  </label>
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      id="quantity"
                      min="1"
                      max={currentProduct.stock}
                      value={quantity}
                      onChange={(e) =>
                        handleQuantityChange(parseInt(e.target.value))
                      }
                      className="w-14 text-center border-0 focus:outline-none focus:ring-0 bg-transparent text-gray-700 dark:text-gray-300"
                    />
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                      disabled={quantity >= currentProduct.stock}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex-grow">
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center"
                  >
                    <ShoppingCart size={20} className="mr-2" />
                    {isInCart ? "Add More to Cart" : "Add to Cart"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleToggleWishlist}
            className={`w-full font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center mb-6 ${
              liked
                ? "bg-primary text-white hover:bg-primary-dark"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <Heart
              size={20}
              className="mr-2"
              fill={liked ? "currentColor" : "none"}
            />
            {liked ? "좋아요 제거하기" : "좋아요"}
          </button>

          {currentProduct.stock <= 5 && currentProduct.stock > 0 && (
            <div className="flex items-start bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
              <Info
                size={20}
                className="text-amber-500 mr-3 flex-shrink-0 mt-0.5"
              />
              <p className="text-amber-800 dark:text-amber-400 text-sm">
                상품이 {currentProduct.stock}개 남았어요 서두르세요!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          고객 리뷰
        </h2>

        {reviews.length === 0 ? (
          <div className="bg-gray-50 dark:bg-secondary-light rounded-lg p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              아직 리뷰가 작성되지 않았어요
            </p>
            {showReviewForm && !hasReviewed && (
              <button
                onClick={() =>
                  document
                    .getElementById("review-form")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded-lg transition"
              >
                리뷰 쓰기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(
              new Map(reviews.map((review) => [review.id, review])).values()
            ).map((review, index) => (
              <div
                key={`review-${review.id}-${index}`}
                className="bg-white dark:bg-secondary-light rounded-lg shadow-sm p-6"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {review.userPhoto ? (
                      <img
                        src={review.userPhoto}
                        alt={review.userName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                          {review.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {review.userName}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={`review-star-${review.id}-${index}-${star}`}
                          size={16}
                          fill={review.rating >= star ? "currentColor" : "none"}
                          className={
                            review.rating >= star
                              ? "text-amber-500"
                              : "text-gray-300 dark:text-gray-600"
                          }
                        />
                      ))}
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {review.comment}
                    </p>

                    {review.photos && review.photos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {review.photos.map((photo, photoIndex) => (
                          <img
                            key={`review-photo-${review.id}-${index}-${photoIndex}`}
                            src={photo}
                            alt={`Review by ${review.userName}`}
                            className="w-24 h-24 object-cover rounded-md cursor-pointer"
                            onClick={() => window.open(photo, "_blank")}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && !hasReviewed && (
          <div
            id="review-form"
            className="mt-10 bg-white dark:bg-secondary-light rounded-lg shadow-sm p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              리뷰 쓰기
            </h3>

            <form onSubmit={handleReviewSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rating
                </label>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={`rating-star-${star}`}
                      type="button"
                      onClick={() =>
                        setReviewData((prev) => ({ ...prev, rating: star }))
                      }
                      className="mr-1 focus:outline-none"
                    >
                      <Star
                        size={24}
                        fill={
                          reviewData.rating >= star ? "currentColor" : "none"
                        }
                        className={
                          reviewData.rating >= star
                            ? "text-amber-500"
                            : "text-gray-300 dark:text-gray-600"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="review-comment"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Your Review
                </label>
                <textarea
                  id="review-comment"
                  rows={4}
                  required
                  value={reviewData.comment}
                  onChange={(e) =>
                    setReviewData((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary dark:text-white"
                  placeholder="상품을 사용한 경험을 작성해주세요"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  사진 (Optional)
                </label>
                <div className="flex items-center flex-wrap gap-2">
                  {reviewPhotoPreviews.map((preview, index) => (
                    <div
                      key={`preview-${index}`}
                      className="relative w-20 h-20"
                    >
                      <img
                        src={preview}
                        alt={`Review upload ${index + 1}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {reviewData.photos.length < 3 && (
                    <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:border-primary dark:hover:border-primary">
                      <Upload
                        size={20}
                        className="text-gray-500 dark:text-gray-400 mb-1"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Upload
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  이미지는 3장까지 업로드 할 수 있어요
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        )}

        {hasReviewed && (
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <Check size={20} className="text-green-500 mr-2" />
              <p className="text-green-800 dark:text-green-400">
                리뷰 작성이 완료되었어요
              </p>
            </div>
          </div>
        )}

        {!showReviewForm && !hasReviewed && (
          <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center">
              <Info size={20} className="text-amber-500 mr-2" />
              <p className="text-amber-800 dark:text-amber-400">
                상품을 구매한 고객님에 한에 리뷰를 작성할 수 있어요
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
