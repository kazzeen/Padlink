"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import { useState, useEffect } from "react";

const Map = dynamic(() => import("@/components/ui/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-800/20 animate-pulse">
      <span className="text-[var(--glass-text-muted)]">Loading map...</span>
    </div>
  ),
});

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error: Error & { info?: unknown; status?: number } = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export default function ListingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: listing, error, isLoading, mutate } = useSWR(
    params?.id ? `/api/listings/${params.id}` : null,
    fetcher,
    {
      shouldRetryOnError: false
    }
  );

  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (error) {
      console.error("Error loading listing:", error);
      if (error.status === 404) {
        console.warn(`Listing ${params.id} not found.`);
      }
    }
  }, [error, params.id]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    const isNotFound = error.status === 404;
    return (
      <div className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-red-400 mb-4">
          {isNotFound ? "Listing Not Found" : "Something went wrong"}
        </h1>
        <p className="text-[var(--glass-text-muted)] mb-6">
          {isNotFound 
            ? "The property you are looking for might have been removed or is temporarily unavailable."
            : "We couldn't load the listing details. Please try again later."}
        </p>
        <div className="flex gap-4">
          <GlassButton onClick={() => router.push("/listings")}>
            Back to Listings
          </GlassButton>
          {!isNotFound && (
            <GlassButton variant="secondary" onClick={() => mutate()}>
              Retry
            </GlassButton>
          )}
        </div>
      </div>
    );
  }

  const images = listing.images.length > 0 ? listing.images : ["/placeholder-house.jpg"];

  return (
    <div className="container mx-auto p-4 space-y-6 pb-20">
      <GlassButton variant="secondary" size="sm" onClick={() => router.back()} className="mb-4">
        ← Back
      </GlassButton>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[50vh] min-h-[400px]">
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-gray-800 border border-[var(--glass-border)]">
          <Image
            src={images[activeImage]}
            alt={listing.title}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="hidden lg:grid grid-rows-2 gap-4">
          {images.slice(1, 3).map((img: string, idx: number) => (
            <div 
              key={idx} 
              className="relative rounded-2xl overflow-hidden bg-gray-800 border border-[var(--glass-border)] cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setActiveImage(idx + 1)}
            >
              <Image src={img} alt={`View ${idx + 2}`} fill className="object-cover" />
            </div>
          ))}
          {images.length < 2 && (
            <div className="relative rounded-2xl overflow-hidden bg-gray-800/50 border border-[var(--glass-border)] flex items-center justify-center">
              <span className="text-[var(--glass-text-muted)]">No more images</span>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails for mobile */}
      <div className="flex lg:hidden gap-2 overflow-x-auto pb-2">
        {images.map((img: string, idx: number) => (
          <div 
            key={idx} 
            className={`relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 ${activeImage === idx ? 'border-blue-500' : 'border-transparent'}`}
            onClick={() => setActiveImage(idx)}
          >
            <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-[var(--glass-text)] mb-2">{listing.title}</h1>
                <p className="text-[var(--glass-text-muted)] flex items-center gap-2">
                  📍 {listing.address}, {listing.city}, {listing.state} {listing.zipCode}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-400">${listing.rentAmount}/mo</p>
                <p className="text-sm text-[var(--glass-text-muted)]">
                  {listing.roomType === "private" ? "Private Room" : "Shared Room"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t border-b border-[var(--glass-border)]">
              <div className="text-center">
                <span className="block text-2xl">🛏️</span>
                <span className="text-sm font-medium">{listing.bedrooms} Bed</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl">🚿</span>
                <span className="text-sm font-medium">{listing.bathrooms} Bath</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl">📏</span>
                <span className="text-sm font-medium">{listing.sqft || "--"} sqft</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl">👥</span>
                <span className="text-sm font-medium">Max {listing.maxOccupants || "--"}</span>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-3">About this place</h3>
              <p className="text-[var(--glass-text)] leading-relaxed whitespace-pre-wrap">
                {listing.description || "No description provided."}
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold mb-4">Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {listing.amenities && listing.amenities.length > 0 ? (
                listing.amenities.map((amenity: string) => (
                  <div key={amenity} className="flex items-center gap-2 text-[var(--glass-text)]">
                    <span className="text-green-400">✓</span> {amenity}
                  </div>
                ))
              ) : (
                <p className="text-[var(--glass-text-muted)]">No amenities listed.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold mb-4">Location</h3>
            <div className="h-[300px] w-full rounded-xl overflow-hidden border border-[var(--glass-border)] relative z-0">
              <Map 
                address={listing.address}
                city={listing.city}
                state={listing.state}
                zipCode={listing.zipCode}
              />
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Lease Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--glass-text-muted)]">Move-in Date</span>
                <span className="font-medium">{new Date(listing.moveInDate).toLocaleDateString("en-US", { timeZone: "UTC" })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--glass-text-muted)]">Lease Term</span>
                <span className="font-medium">{listing.leaseTerm} months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--glass-text-muted)]">Security Deposit</span>
                <span className="font-medium">1 month rent</span>
              </div>
            </div>
            
            <Link href={`/messages/${listing.userId}`}>
              <GlassButton className="w-full mt-6 bg-blue-600 hover:bg-blue-700 border-none">
                Contact Host
              </GlassButton>
            </Link>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Meet the Host</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-700">
                {(listing.user.image || listing.user.avatar) && (
                  <Image 
                    src={listing.user.image || listing.user.avatar} 
                    alt={listing.user.name || "Host"} 
                    fill 
                    className="object-cover"
                  />
                )}
              </div>
              <div>
                <h4 className="font-bold">{listing.user.name || "PadLink User"}</h4>
                <p className="text-xs text-[var(--glass-text-muted)]">Joined {new Date(listing.user.createdAt).getFullYear()}</p>
              </div>
            </div>
            <Link href={`/profile/${listing.user.id}`}>
              <GlassButton variant="secondary" className="w-full text-sm">
                View Profile
              </GlassButton>
            </Link>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
