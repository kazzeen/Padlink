import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Define validation schema matching the frontend
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().nullable(),
  age: z.number().min(18).max(120).optional().nullable(),
  avatar: z.string().refine((val) => {
    if (!val) return true;
    return val.startsWith("/") || /^(http|https):\/\//.test(val);
  }, "Must be a valid URL or path").optional().nullable(),
  preferences: z.object({
    minBudget: z.number().min(0),
    maxBudget: z.number().min(0),
    preferredCities: z.array(z.string()).min(1, "At least one city is required"),
    commutDistance: z.number().min(0),
    sleepSchedule: z.enum(["early_bird", "night_owl", "flexible"]),
    cleanlinesLevel: z.number().min(1).max(5),
    socialPreference: z.enum(["introvert", "extrovert", "ambivert"]),
    smokingStatus: z.enum(["non_smoker", "smoker", "okay_with_smoker"]),
    // Optional weights
    budgetWeight: z.number().optional(),
    locationWeight: z.number().optional(),
    sleepScheduleWeight: z.number().optional(),
    foodHabitsWeight: z.number().optional(),
    cleanlinessWeight: z.number().optional(),
    personalityWeight: z.number().optional(),
  }).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { preferences: true },
    });

    if (!user) {
      console.warn(`[Profile] User not found for session ID: ${session.user.id}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`[Profile] Retrieved profile for user: ${user.email} (${user.id})`);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    const minimal = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      avatar: session.user.image,
      image: session.user.image,
      role: session.user.role,
      preferences: null,
    };
    console.warn("Profile fallback: returning minimal session user");
    return NextResponse.json(minimal);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate request data
    let validatedData;
    try {
      validatedData = profileSchema.parse(data);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: validationError.issues },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Update user profile
    console.log("Updating user profile for:", session.user.id);
    console.log("Validated data:", JSON.stringify(validatedData, null, 2));
    
    // Explicitly log avatar update intent
    const newAvatar = validatedData.avatar || null;
    console.log("Setting avatar to:", newAvatar);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedData.name,
        age: validatedData.age,
        bio: validatedData.bio,
        avatar: newAvatar, 
        image: newAvatar, // Sync image with avatar
        preferences: validatedData.preferences ? {
          upsert: {
            create: {
              sleepSchedule: validatedData.preferences.sleepSchedule,
              cleanlinesLevel: validatedData.preferences.cleanlinesLevel,
              socialPreference: validatedData.preferences.socialPreference,
              smokingStatus: validatedData.preferences.smokingStatus,
              minBudget: validatedData.preferences.minBudget,
              maxBudget: validatedData.preferences.maxBudget,
              preferredCities: JSON.stringify(validatedData.preferences.preferredCities),
              commutDistance: validatedData.preferences.commutDistance,
              // Use defaults for weights if not provided
              budgetWeight: validatedData.preferences.budgetWeight ?? 20,
              locationWeight: validatedData.preferences.locationWeight ?? 15,
              sleepScheduleWeight: validatedData.preferences.sleepScheduleWeight ?? 20,
              foodHabitsWeight: validatedData.preferences.foodHabitsWeight ?? 15,
              cleanlinessWeight: validatedData.preferences.cleanlinessWeight ?? 15,
              personalityWeight: validatedData.preferences.personalityWeight ?? 15,
            },
            update: {
              sleepSchedule: validatedData.preferences.sleepSchedule,
              cleanlinesLevel: validatedData.preferences.cleanlinesLevel,
              socialPreference: validatedData.preferences.socialPreference,
              smokingStatus: validatedData.preferences.smokingStatus,
              minBudget: validatedData.preferences.minBudget,
              maxBudget: validatedData.preferences.maxBudget,
              preferredCities: JSON.stringify(validatedData.preferences.preferredCities),
              commutDistance: validatedData.preferences.commutDistance,
              budgetWeight: validatedData.preferences.budgetWeight,
              locationWeight: validatedData.preferences.locationWeight,
              sleepScheduleWeight: validatedData.preferences.sleepScheduleWeight,
              foodHabitsWeight: validatedData.preferences.foodHabitsWeight,
              cleanlinessWeight: validatedData.preferences.cleanlinessWeight,
              personalityWeight: validatedData.preferences.personalityWeight,
            },
          },
        } : undefined,
      },
      include: { preferences: true },
    });

    console.log("User updated successfully");
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
