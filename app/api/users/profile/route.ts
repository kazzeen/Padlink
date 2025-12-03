import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Define validation schema matching the frontend
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  age: z.number().min(18).max(120).optional(),
  avatar: z.string().url().optional().or(z.literal("")),
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
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { preferences: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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
          { error: "Validation failed", details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedData.name,
        age: validatedData.age,
        bio: validatedData.bio,
        avatar: validatedData.avatar,
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

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
