import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    });

    if (!listing) {
      console.warn(`Listing not found for ID: ${params.id}`);
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Parse JSON fields safely
    let amenities = [];
    let images = [];
    try {
      amenities = listing.amenities ? JSON.parse(listing.amenities) : [];
      images = listing.images ? JSON.parse(listing.images) : [];
    } catch (parseError) {
      console.error(`Error parsing JSON fields for listing ${params.id}:`, parseError);
      // Continue with empty arrays or partial data if possible, or fail?
      // Better to continue with empty arrays to avoid breaking the UI entirely
    }

    const parsedListing = {
      ...listing,
      amenities,
      images,
    };

    return NextResponse.json(parsedListing);
  } catch (error) {
    console.error(`Listing GET error for ID ${await props.params.then(p => p.id).catch(() => 'unknown')}:`, error);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.listing.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Listing deleted" });
  } catch (error) {
    console.error("Listing DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
