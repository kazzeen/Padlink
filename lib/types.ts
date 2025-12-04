export type Listing = {
  id: string;
  title: string;
  city: string;
  state: string;
  rentAmount: number;
  bedrooms: number;
  bathrooms: number;
  roomType: string;
  images: string[];
  isActive: boolean;
  user: {
    name: string | null;
    image: string | null;
    avatar: string | null;
  };
  createdAt: string;
};

export type User = {
  id: string;
  name?: string | null;
  image?: string | null;
  avatar?: string | null;
  age?: number | null;
  bio?: string | null;
  preferences?: {
    minBudget?: number | null;
    maxBudget?: number | null;
    preferredCities?: string | null;
  } | null;
  [key: string]: unknown;
};
