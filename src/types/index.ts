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
