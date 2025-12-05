import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { listingSchema } from "@/lib/schemas";

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

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = listingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
    }

    const data = validation.data;

    const existingListing = await prisma.listing.findUnique({
      where: { id: params.id },
    });

    if (!existingListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (existingListing.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedListing = await prisma.listing.update({
      where: { id: params.id },
      data: {
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

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "LISTING_UPDATE",
        details: JSON.stringify({ listingId: params.id, changes: data }),
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json(updatedListing);
  } catch (error) {
    console.error("Listing PUT error:", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
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

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "LISTING_DELETE",
        details: JSON.stringify({ listingId: params.id, title: listing.title }),
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ message: "Listing deleted" });
  } catch (error) {
    console.error("Listing DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
