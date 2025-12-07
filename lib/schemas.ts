import { z } from "zod";

export const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  propertyType: z.string().min(1, "Property type is required"),
  roomType: z.enum(["private", "shared"]),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  sqft: z.number().positive().optional(),
  maxOccupants: z.number().positive().optional(),
  
  rentAmount: z.number().positive("Rent amount must be positive"),
  moveInDate: z.string().or(z.date()), // Allow string from JSON
  leaseTerm: z.number().positive("Lease term must be positive"),
  
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "Zip code is required"),
  
  amenities: z.array(z.string()).optional(), // We'll handle stringify/parse in the API
  images: z.array(z.string()).optional(), // We'll handle stringify/parse in the API
});

export type ListingFormData = z.infer<typeof listingSchema>;

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  // Handle age being cleared (NaN) -> null
  age: z.preprocess(
    (val) => (typeof val === "number" && isNaN(val) ? null : val),
    z.number().min(18, "Must be at least 18").max(120, "Must be under 120").nullable().optional()
  ).optional(),
  avatar: z.string().refine((val) => {
    if (!val) return true;
    return val.startsWith("/") || /^(http|https):\/\//.test(val) || val.startsWith("data:");
  }, "Must be a valid URL or path").optional().or(z.literal("")),
  preferences: z.object({
    minBudget: z.preprocess(
        (val) => (typeof val === "number" && isNaN(val) ? 0 : val),
        z.number().min(0, "Must be positive")
    ),
    maxBudget: z.preprocess(
        (val) => (typeof val === "number" && isNaN(val) ? 0 : val),
        z.number().min(0, "Must be positive")
    ),
    // Ensure at least one valid city is extracted
    preferredCities: z.string().refine((val) => {
        if (!val) return false;
        const cities = val.split(",").map(c => c.trim()).filter(c => c.length > 0);
        return cities.length > 0;
    }, "Please enter at least one city"),
    commutDistance: z.preprocess(
        (val) => (typeof val === "number" && isNaN(val) ? 0 : val),
        z.number().min(0, "Must be positive")
    ),
    sleepSchedule: z.enum(["early_bird", "night_owl", "flexible"]),
    cleanlinesLevel: z.number().min(1).max(5),
    socialPreference: z.enum(["introvert", "extrovert", "ambivert"]),
    smokingStatus: z.enum(["non_smoker", "smoker", "okay_with_smoker"]),
  }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
