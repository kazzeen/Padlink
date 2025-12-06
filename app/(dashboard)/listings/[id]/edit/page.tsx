import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import EditListingClient from "./EditListingClient";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return <div>Please log in</div>;
  }

  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
        user: true // Include user for ownership check or display if needed
    }
  });

  if (!listing) {
    notFound();
  }

  // Verify ownership
  if (listing.userId !== session.user.id) {
    return <div>Unauthorized</div>;
  }

  // Parse JSON fields
  let parsedAmenities: string[] = [];
  let parsedImages: string[] = [];
  try {
    parsedAmenities = JSON.parse(listing.amenities);
  } catch {
    parsedAmenities = [];
  }
  try {
    parsedImages = JSON.parse(listing.images);
  } catch {
    parsedImages = [];
  }

  const serializedListing = {
      ...listing,
      moveInDate: listing.moveInDate.toISOString(),
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
      amenities: parsedAmenities,
      images: parsedImages,
  };

  return <EditListingClient listing={serializedListing} />;
}
