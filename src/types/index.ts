export type User = {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: number;
  updatedAt: number;
  address?: string;
  phoneNumber?: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPercentage?: number;
  images: string[];
  category: string;
  stock: number;
  rating: number;
  numReviews: number;
  createdAt: number;
  updatedAt: number;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type WishlistItem = {
  productId: string;
  addedAt: number;
};

export type Review = {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  photos?: string[];
  createdAt: number;
  updatedAt?: number;
};
