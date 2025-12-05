export type Listing = {
  id: string;
  title: string;
  description?: string | null;
  propertyType?: string | null;
  roomType: string;
  bedrooms: number;
  bathrooms: number;
  sqft?: number | null;
  maxOccupants?: number | null;
  rentAmount: number;
  moveInDate: string; // ISO string
  leaseTerm: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  amenities: string[];
  images: string[];
  isActive: boolean;
  userId: string;
  user: {
    id?: string;
    name: string | null;
    image: string | null;
    avatar: string | null;
    createdAt?: Date | string;
  };
  createdAt: string | Date;
  updatedAt?: string | Date;
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
