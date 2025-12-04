import Image from "next/image";
import Link from "next/link";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import { Listing } from "@/lib/types";

type MyListingCardProps = {
  listing: Listing;
  onEdit?: (listing: Listing) => void;
  onDelete?: (id: string) => void;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function MyListingCard({ listing, onEdit, onDelete }: MyListingCardProps) {
  const mainImage = listing.images && listing.images.length > 0 ? listing.images[0] : "/placeholder-house.jpg";
  
  return (
    <GlassCard className="p-0 overflow-hidden flex flex-col h-full hover:scale-[1.02] transition-transform duration-300 relative group">
      <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-800">
        <Image
          src={mainImage}
          alt={listing.title}
          fill
          className="object-cover"
        />
        <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full backdrop-blur-sm font-medium ${
          listing.isActive 
            ? "bg-green-500/80 text-white" 
            : "bg-gray-500/80 text-white"
        }`}>
          {listing.isActive ? "Active" : "Inactive"}
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
        
        <div className="mt-auto pt-3 border-t border-[var(--glass-border)] flex justify-between items-center gap-2">
           <Link href={`/listings/${listing.id}`} className="flex-1">
            <GlassButton size="sm" variant="secondary" className="w-full text-xs px-2 py-1">
              View
            </GlassButton>
          </Link>
          {/* 
          <GlassButton 
            size="sm" 
            variant="primary" 
            className="flex-1 text-xs px-2 py-1"
            onClick={() => onEdit && onEdit(listing)}
          >
            Edit
          </GlassButton>
          */}
          {/* Delete button can be added here */}
        </div>
      </div>
    </GlassCard>
  );
}
