import { useState, useRef, ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { updateUserProfile } from "../store/slices/authSlice";
import { showToast } from "../store/slices/uiSlice";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Camera, Loader, User, Mail, Phone, MapPin } from "lucide-react";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    address: user?.address || "",
    phoneNumber: user?.phoneNumber || "",
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      dispatch(
        showToast({
          message: "Image size should be less than 5MB",
          type: "error",
        })
      );
      return;
    }

    try {
      setIsUploading(true);
      const storage = getStorage();
      const fileRef = ref(storage, `users/${user.id}/profile-${Date.now()}`);

      await uploadBytes(fileRef, file);
      const photoURL = await getDownloadURL(fileRef);

      await dispatch(
        updateUserProfile({
          userId: user.id,
          photoURL,
        }) as any
      );

      dispatch(
        showToast({
          message: "Profile photo updated successfully",
          type: "success",
        })
      );
    } catch (error) {
      console.error("Error uploading photo:", error);
      dispatch(
        showToast({ message: "Failed to update profile photo", type: "error" })
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setIsSaving(true);

      await dispatch(
        updateUserProfile({
          userId: user.id,
          displayName: formData.displayName,
          address: formData.address,
          phoneNumber: formData.phoneNumber,
        }) as any
      );

      dispatch(
        showToast({ message: "Profile updated successfully", type: "success" })
      );
    } catch (error) {
      console.error("Error updating profile:", error);
      dispatch(
        showToast({ message: "Failed to update profile", type: "error" })
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            사용자를 찾을 수 없어요
          </h1>
          <p className="text-gray-600 dark:text-gray-400">로그인 해주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        My Profile
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-secondary-light rounded-lg shadow-sm p-6">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <User size={64} />
                    </div>
                  )}
                </div>
                <button
                  onClick={handlePhotoClick}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 bg-primary hover:bg-primary-dark text-white rounded-full p-2 shadow-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <Camera size={18} />
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {user.displayName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4 flex items-center">
                <Mail size={16} className="mr-1" />
                {user.email}
              </p>

              <div className="w-full space-y-3 text-sm">
                {user.phoneNumber && (
                  <div className="flex items-start">
                    <Phone
                      size={16}
                      className="text-primary mr-2 mt-0.5 flex-shrink-0"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {user.phoneNumber}
                    </span>
                  </div>
                )}

                {user.address && (
                  <div className="flex items-start">
                    <MapPin
                      size={16}
                      className="text-primary mr-2 mt-0.5 flex-shrink-0"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {user.address}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-secondary-light rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Edit Profile
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  이름
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  주소
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  전화번호
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary dark:text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || isSaving}
                  className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader size={18} className="animate-spin mr-2" />
                      저장중...
                    </>
                  ) : (
                    "저장하기"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
