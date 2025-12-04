import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PreferenceProfile } from "@prisma/client";

// Calculate compatibility score between two users
function calculateCompatibilityScore(
  user1Prefs: PreferenceProfile,
  user2Prefs: PreferenceProfile
): number {
  let score = 0;

  // Budget compatibility (20% weight)
  const budgetGap = Math.abs(user1Prefs.maxBudget - user2Prefs.minBudget);
  const budgetScore = Math.max(0, 100 - budgetGap / 10);
  score += (budgetScore * user1Prefs.budgetWeight) / 100;

  // Sleep schedule compatibility (20% weight)
  const sleepMatch = user1Prefs.sleepSchedule === user2Prefs.sleepSchedule ? 100 : 50;
  score += (sleepMatch * user1Prefs.sleepScheduleWeight) / 100;

  // Cleanliness compatibility (15% weight)
  const cleanlinessGap = Math.abs(
    user1Prefs.cleanlinesLevel - user2Prefs.cleanlinesLevel
  );
  const cleanlinessScore = Math.max(0, 100 - cleanlinessGap * 20);
  score += (cleanlinessScore * user1Prefs.cleanlinessWeight) / 100;

  // Location preferences (15% weight)
  // Parse preferredCities from JSON string if needed
  let user1Cities: string[] = [];
  let user2Cities: string[] = [];
  try {
    user1Cities = JSON.parse(user1Prefs.preferredCities);
    user2Cities = JSON.parse(user2Prefs.preferredCities);
  } catch {
    // Fallback if not JSON
    user1Cities = [user1Prefs.preferredCities];
    user2Cities = [user2Prefs.preferredCities];
  }

  const locationMatch =
    user1Cities.some((city: string) =>
      user2Cities.includes(city)
    ) ? 100 : 30;
  score += (locationMatch * user1Prefs.locationWeight) / 100;

  // Personality compatibility (15% weight)
  const personalityMatch =
    user1Prefs.socialPreference === user2Prefs.socialPreference ? 100 : 60;
  score += (personalityMatch * user1Prefs.personalityWeight) / 100;

  // Food/lifestyle compatibility (15% weight)
  const foodMatch = 75; // Could be enhanced with more detailed data
  score += (foodMatch * 15) / 100;

  return Math.round(score);
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's preferences
    const userPreferences = await prisma.preferenceProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userPreferences) {
      return NextResponse.json(
        { error: "Please complete your preferences first" },
        { status: 400 }
      );
    }

    // Find potential matches
    // Note: SQLite doesn't support array operations like 'hasSome' on JSON strings easily. 
    // For this prototype, we will fetch all roommate seekers and filter in memory.
    // In production with Postgres, we would use proper array filtering.
    
    const allSeekers = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        role: "ROOMMATE_SEEKER",
      },
      include: { preferences: true },
    });

    // Filter and score matches
    const scoredMatches = allSeekers
      .filter((seeker) => seeker.preferences) // Must have preferences
      .map((seeker) => {
        // We know preferences is not null due to the filter above, but TS needs reassurance or a type guard
        if (!seeker.preferences) return { ...seeker, matchScore: 0 };
        
        const score = calculateCompatibilityScore(userPreferences, seeker.preferences);
        return { ...seeker, matchScore: score };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json(scoredMatches);
  } catch (error) {
    console.error("Matching error:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
