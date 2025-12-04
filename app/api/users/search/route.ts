import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Filters
    const query = searchParams.get("query") || ""; // Name or Bio
    const minBudget = parseInt(searchParams.get("minBudget") || "0");
    const maxBudget = parseInt(searchParams.get("maxBudget") || "10000");
    const city = searchParams.get("city") || "";
    const sort = searchParams.get("sort") || "newest"; // newest, budget_asc, budget_desc

    // Prepare preferences filter
    const preferencesFilter: Prisma.PreferenceProfileWhereInput = {};

    if (city) {
        preferencesFilter.preferredCities = { contains: city };
    }

    if (minBudget > 0 || maxBudget < 10000) {
        preferencesFilter.AND = [
            { minBudget: { gte: minBudget } },
            { maxBudget: { lte: maxBudget } }
        ];
    }

    // Build Prisma Query
    const whereClause: Prisma.UserWhereInput = {
      id: { not: session.user.id }, // Exclude self
      // Only show users who have preferences set (active seekers) and match criteria
      preferences: {
        is: preferencesFilter
      },
      OR: [
        { name: { contains: query } }, 
        { bio: { contains: query } },
      ],
    };

    // Sorting
    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: 'desc' };
    
    if (sort === 'budget_asc') {
        orderBy = { preferences: { minBudget: 'asc' } };
    } else if (sort === 'budget_desc') {
        orderBy = { preferences: { maxBudget: 'desc' } };
    }

    // Execute Query
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          preferences: true,
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}