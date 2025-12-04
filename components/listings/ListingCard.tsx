import Image from "next/image";
import Link from "next/link";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";

type Listing = {
  id: string;
  title: string;
  city: string;
  state: string;
  rentAmount: number;
  bedrooms: number;
  bathrooms: number;
  roomType: string;
  images: string[];
  user: {
    name: string | null;
    image: string | null;
    avatar: string | null;
  };
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const mainImage = listing.images.length > 0 ? listing.images[0] : "/placeholder-house.jpg";

  return (
    <GlassCard className="p-0 overflow-hidden flex flex-col h-full hover:scale-[1.02] transition-transform duration-300">
      <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-800">
        <Image
          src={mainImage}
          alt={listing.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
          {listing.roomType === "private" ? "Private Room" : "Shared Room"}
        </div>
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-sm px-2 py-1 rounded-lg backdrop-blur-sm font-semibold">
          ${listing.rentAmount}/mo
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-[var(--glass-text)] line-clamp-1" title={listing.title}>
            {listing.title}
          </h3>
        </div>
        
        <p className="text-sm text-[var(--glass-text-muted)] mb-3 flex items-center gap-1">
          📍 {listing.city}, {listing.state}
        </p>
        
        <div className="flex gap-3 text-sm text-[var(--glass-text)] mb-4">
          <span className="flex items-center gap-1">🛏️ {listing.bedrooms} Bed</span>
          <span className="flex items-center gap-1">🚿 {listing.bathrooms} Bath</span>
        </div>
        
        <div className="mt-auto pt-3 border-t border-[var(--glass-border)] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-300">
              {(listing.user.image || listing.user.avatar) && (
                <Image 
                  src={listing.user.image || listing.user.avatar || ""} 
                  alt={listing.user.name || "User"}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <span className="text-xs text-[var(--glass-text-muted)] truncate max-w-[100px]">
              {listing.user.name || "Host"}
            </span>
          </div>
          
          <Link href={`/listings/${listing.id}`}>
            <GlassButton size="sm" variant="secondary" className="text-xs px-3 py-1">
              View Details
            </GlassButton>
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}
