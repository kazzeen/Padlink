import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { listingSchema } from "@/lib/schemas";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Filters
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const city = searchParams.get("city");
    const roomType = searchParams.get("roomType");
    const bedrooms = searchParams.get("bedrooms") ? parseInt(searchParams.get("bedrooms")!) : undefined;
    const sortBy = searchParams.get("sortBy") || "newest";
    const userId = searchParams.get("userId");
    const status = searchParams.get("status") || "active"; // active, inactive, all

    const where: Prisma.ListingWhereInput = {};

    // Filter by status
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    // Security check for showing inactive/all listings
    if (status !== "active") {
      const session = await getSession();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      // If filtering by user, allow if it's the own user or admin
      if (userId) {
        if (session.user.id !== userId && session.user.role !== "ADMIN") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else {
        // If not filtering by user (viewing all), only admin can see inactive
        if (session.user.role !== "ADMIN") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    if (userId) {
      where.userId = userId;
    }

    let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: "desc" };
    if (sortBy === "price_asc") orderBy = { rentAmount: "asc" };
    if (sortBy === "price_desc") orderBy = { rentAmount: "desc" };

    if (minPrice || maxPrice) {
      where.rentAmount = {};
      if (minPrice) where.rentAmount.gte = minPrice;
      if (maxPrice) where.rentAmount.lte = maxPrice;
    }

    if (city) {
      where.city = { contains: city }; // SQLite case sensitivity might vary, typically case-insensitive in simple implementations or requires raw query
    }

    if (roomType) {
      where.roomType = roomType;
    }

    if (bedrooms) {
      where.bedrooms = { gte: bedrooms };
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              name: true,
              image: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    // Parse JSON fields for response
    const parsedListings = listings.map((listing) => ({
      ...listing,
      amenities: listing.amenities ? JSON.parse(listing.amenities) : [],
      images: listing.images ? JSON.parse(listing.images) : [],
    }));

    return NextResponse.json({
      listings: parsedListings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Listings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate with Zod
    const validation = listingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
    }

    const data = validation.data;

    const listing = await prisma.listing.create({
      data: {
        userId: session.user.id,
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        roomType: data.roomType,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        sqft: data.sqft,
        maxOccupants: data.maxOccupants,
        rentAmount: data.rentAmount,
        moveInDate: new Date(data.moveInDate),
        leaseTerm: data.leaseTerm,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        amenities: JSON.stringify(data.amenities || []),
        images: JSON.stringify(data.images || []),
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error("Listing POST error:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
