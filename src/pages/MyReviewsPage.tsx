import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { showToast } from "../store/slices/uiSlice";
import {
  getCollectionWithMillis,
  updateDocumentWithTimestamp,
  deleteDocument,
  getDocumentWithMillis,
} from "../utils/firebaseUtils";
import { Review, Product } from "../types";
import {
  Star,
  Edit,
  Trash,
  ChevronLeft,
  Save,
  Upload,
  X,
  AlertCircle,
} from "lucide-react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface MyReview extends Review {
  product?: Product;
}

const MyReviewsPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [deletingReview, setDeletingReview] = useState(false);
  const [editFormData, setEditFormData] = useState({
    rating: 5,
    comment: "",
    newPhotos: [] as File[],
    photoPreviews: [] as string[],
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUserReviews();
  }, [user]);

  const fetchUserReviews = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 사용자의 리뷰 가져오기
      const userReviews = await getCollectionWithMillis<Review>("reviews", [
        {
          field: "userId",
          operator: "==",
          value: user.id,
        },
        {
          orderByField: "createdAt",
          orderDirection: "desc",
        },
      ]);

      // 각 리뷰에 해당하는 상품 정보 가져오기
      const reviewsWithProducts: MyReview[] = [];

      for (const review of userReviews) {
        const product = await getCollectionWithMillis<Product>("products", [
          {
            field: "id",
            operator: "==",
            value: review.productId,
          },
        ]);

        reviewsWithProducts.push({
          ...review,
          product: product[0],
        });
      }

      setReviews(reviewsWithProducts);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      dispatch(
        showToast({ message: "Failed to load your reviews", type: "error" })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review: MyReview) => {
    setEditingReviewId(review.id);
    setEditFormData({
      rating: review.rating,
      comment: review.comment,
      newPhotos: [],
      photoPreviews: [],
    });
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditFormData({
      rating: 5,
      comment: "",
      newPhotos: [],
      photoPreviews: [],
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    // Limit to 3 images
    if (editFormData.newPhotos.length + files.length > 3) {
      dispatch(
        showToast({ message: "You can upload maximum 3 images", type: "error" })
      );
      return;
    }

    setEditFormData((prev) => ({
      ...prev,
      newPhotos: [...prev.newPhotos, ...files],
    }));

    // 리뷰 미리보기
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setEditFormData((prev) => ({
      ...prev,
      photoPreviews: [...prev.photoPreviews, ...newPreviews],
    }));
  };

  const removePhoto = (index: number) => {
    setEditFormData((prev) => ({
      ...prev,
      newPhotos: prev.newPhotos.filter((_, i) => i !== index),
      photoPreviews: prev.photoPreviews.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateReview = async (reviewId: string) => {
    if (!user) return;

    try {
      setUpdating(true);

      const reviewToUpdate = reviews.find((r) => r.id === reviewId);
      if (!reviewToUpdate) return;

      // 사진있으면 업로드
      const photoUrls: string[] = reviewToUpdate.photos || [];

      if (editFormData.newPhotos.length > 0) {
        const storage = getStorage();

        for (const photo of editFormData.newPhotos) {
          const fileRef = ref(
            storage,
            `reviews/${user.id}/${Date.now()}_${photo.name}`
          );
          await uploadBytes(fileRef, photo);
          const downloadUrl = await getDownloadURL(fileRef);
          photoUrls.push(downloadUrl);
        }
      }

      // 선언한 updateReview 함수 사용
      await updateReview(reviewId, {
        rating: editFormData.rating,
        comment: editFormData.comment,
        photos: photoUrls.length > 0 ? photoUrls : undefined,
      });

      // Refresh reviews
      await fetchUserReviews();

      setEditingReviewId(null);
      dispatch(
        showToast({ message: "Review updated successfully", type: "success" })
      );
    } catch (error) {
      console.error("Error updating review:", error);
      dispatch(
        showToast({ message: "Failed to update review", type: "error" })
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;

    try {
      setDeletingReview(true);

      // 선언한 deleteReview 함수 사용
      await deleteReview(reviewId);

      // Refresh reviews
      await fetchUserReviews();

      setShowDeleteConfirm(null);
      dispatch(
        showToast({ message: "Review deleted successfully", type: "success" })
      );
    } catch (error) {
      console.error("Error deleting review:", error);
      dispatch(
        showToast({ message: "Failed to delete review", type: "error" })
      );
    } finally {
      setDeletingReview(false);
    }
  };

  const updateReview = async (
    reviewId: string,
    updatedData: { rating: number; comment: string; photos?: string[] }
  ) => {
    try {
      // 기존 리뷰 정보 가져오기
      const existingReview = await getDocumentWithMillis<Review>(
        "reviews",
        reviewId
      );
      if (!existingReview) {
        throw new Error("Review not found");
      }

      // 리뷰 업데이트
      await updateDocumentWithTimestamp("reviews", reviewId, updatedData);

      // 상품의 모든 리뷰 가져오기
      const productReviews = await getCollectionWithMillis<Review>("reviews", [
        {
          field: "productId",
          operator: "==",
          value: existingReview.productId,
        },
      ]);

      // 업데이트된 리뷰를 포함한 새로운 평균 평점 계산
      const totalRating = productReviews.reduce((sum, review) => {
        if (review.id === reviewId) {
          return sum + updatedData.rating; // 업데이트된 별점 사용
        }
        return sum + review.rating;
      }, 0);

      const newRating =
        productReviews.length > 0 ? totalRating / productReviews.length : 0;

      // 상품 업데이트 (별점만 변경)
      await updateDocumentWithTimestamp("products", existingReview.productId, {
        rating: newRating,
      });

      return true;
    } catch (error) {
      console.error("Error updating review:", error);
      throw error;
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      // 기존 리뷰 정보 가져오기
      const existingReview = await getDocumentWithMillis<Review>(
        "reviews",
        reviewId
      );
      if (!existingReview) {
        throw new Error("Review not found");
      }

      // 리뷰 삭제
      await deleteDocument("reviews", reviewId);

      // 상품의 남은 리뷰 가져오기
      const productReviews = await getCollectionWithMillis<Review>("reviews", [
        {
          field: "productId",
          operator: "==",
          value: existingReview.productId,
        },
      ]);

      // 새로운 평균 평점 계산
      const totalRating = productReviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const newRating =
        productReviews.length > 0 ? totalRating / productReviews.length : 0;

      // 상품 업데이트 (별점과 리뷰 개수 모두 변경)
      await updateDocumentWithTimestamp("products", existingReview.productId, {
        rating: newRating,
        numReviews: productReviews.length,
      });

      return true;
    } catch (error) {
      console.error("Error deleting review:", error);
      throw error;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            내가 쓴 리뷰
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            로그인이 필요해요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to="/profile"
          className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary inline-flex items-center"
        >
          <ChevronLeft size={20} className="mr-1" />
          돌아가기
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        내가 쓴 리뷰
      </h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white dark:bg-secondary-light rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <Star size={64} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
            아직 리뷰를 작성하지 않았어요
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            구매한 상품에 대해서만 리뷰를 작성할 수 있어요
          </p>
          <Link
            to="/products"
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition inline-flex items-center"
          >
            쇼핑하기
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-secondary-light rounded-lg shadow-sm overflow-hidden"
            >
              {editingReviewId === review.id ? (
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      리뷰 수정
                    </h3>
                    <button
                      onClick={handleCancelEdit}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rating
                    </label>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setEditFormData((prev) => ({
                              ...prev,
                              rating: star,
                            }))
                          }
                          className="mr-1 focus:outline-none"
                        >
                          <Star
                            size={24}
                            fill={
                              editFormData.rating >= star
                                ? "currentColor"
                                : "none"
                            }
                            className={
                              editFormData.rating >= star
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
                      value={editFormData.comment}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          comment: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary dark:text-white"
                      placeholder="Share your experience with this product..."
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Photos
                    </label>
                    {review.photos && review.photos.length > 0 ? (
                      <div className="flex items-center flex-wrap gap-2 mb-3">
                        {review.photos.map((photo, index) => (
                          <div key={index} className="relative w-20 h-20">
                            <img
                              src={photo}
                              alt={`Review photo ${index + 1}`}
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        업로드한 사진이 없어요
                      </p>
                    )}

                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      사진 추가하기 (Optional)
                    </label>
                    <div className="flex items-center flex-wrap gap-2">
                      {editFormData.photoPreviews.map((preview, index) => (
                        <div key={index} className="relative w-20 h-20">
                          <img
                            src={preview}
                            alt={`New upload ${index + 1}`}
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

                      {(review.photos?.length || 0) +
                        editFormData.newPhotos.length <
                        3 && (
                        <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:border-primary dark:hover:border-primary">
                          <Upload
                            size={20}
                            className="text-gray-500 dark:text-gray-400 mb-1"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            올리기
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
                      사진은 3장까지 올릴 수 있어요
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleUpdateReview(review.id)}
                      disabled={updating}
                      className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          로딩중...
                        </>
                      ) : (
                        <>
                          <Save size={18} className="mr-2" />
                          저장하기
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-6 rounded-lg transition"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {review.product?.name || "Unknown Product"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          작성일{" "}
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(review)}
                          className="text-primary hover:text-primary-dark"
                          title="Edit review"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(review.id)}
                          className="text-red-500 hover:text-red-600"
                          title="Delete review"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
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
                        {review.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Review photo ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-md cursor-pointer"
                            onClick={() => window.open(photo, "_blank")}
                          />
                        ))}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Link
                        to={`/products/${review.productId}`}
                        className="text-primary hover:text-primary-dark font-medium flex items-center"
                      >
                        상품 보기
                        <ChevronLeft size={16} className="ml-1 rotate-180" />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowDeleteConfirm(null)}
            ></div>

            <div className="bg-white dark:bg-secondary rounded-lg shadow-xl max-w-md w-full z-10 p-6">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
                  <AlertCircle
                    size={24}
                    className="text-red-600 dark:text-red-400"
                  />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-4">
                  리뷰 삭제
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  정말 리뷰를 삭제하시겠어요?
                </p>
              </div>

              <div className="flex flex-col sm:flex-row-reverse gap-3">
                <button
                  type="button"
                  disabled={deletingReview}
                  onClick={() => handleDeleteReview(showDeleteConfirm)}
                  className="w-full sm:w-auto inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {deletingReview ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      삭제중...
                    </>
                  ) : (
                    "리뷰를 삭제했어요"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReviewsPage;
