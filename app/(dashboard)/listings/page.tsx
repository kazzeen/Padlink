"use client";

import { useState } from "react";
import useSWR from "swr";
import { useDebounce } from "@/hooks/useDebounce";
import ListingCard from "@/components/listings/ListingCard";
import { Listing } from "@/lib/types";
import AddListingModal from "@/components/listings/AddListingModal";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import GlassInput from "@/components/ui/glass/GlassInput";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ListingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters
  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [roomType, setRoomType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  // Debounce text inputs
  const debouncedCity = useDebounce(city, 500);
  const debouncedMinPrice = useDebounce(minPrice, 500);
  const debouncedMaxPrice = useDebounce(maxPrice, 500);

  // Construct API URL
  const getApiUrl = () => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", "12");
    
    if (debouncedCity) params.append("city", debouncedCity);
    if (debouncedMinPrice) params.append("minPrice", debouncedMinPrice);
    if (debouncedMaxPrice) params.append("maxPrice", debouncedMaxPrice);
    if (roomType) params.append("roomType", roomType);
    if (bedrooms) params.append("bedrooms", bedrooms);
    if (sortBy) params.append("sortBy", sortBy);

    return `/api/listings?${params.toString()}`;
  };

  const { data, error, isLoading, mutate } = useSWR(getApiUrl(), fetcher);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (data?.pagination?.totalPages || 1)) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Find Your Next Home</h1>
          <p className="text-[var(--glass-text-muted)]">Browse verified listings from our community</p>
        </div>
        <GlassButton onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 border-none shadow-lg shadow-blue-900/20">
          + Post a Listing
        </GlassButton>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="text-xs font-medium text-[var(--glass-text-muted)] ml-1 mb-1 block">Location</label>
            <GlassInput 
              placeholder="Search by city..." 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-xs font-medium text-[var(--glass-text-muted)] ml-1 mb-1 block">Price Range</label>
            <div className="flex gap-2">
              <GlassInput 
                placeholder="Min" 
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full"
              />
              <GlassInput 
                placeholder="Max" 
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--glass-text-muted)] ml-1 mb-1 block">Room Type</label>
            <select 
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/5 border border-[var(--glass-border)] text-[var(--glass-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
            >
              <option value="">Any Type</option>
              <option value="private">Private Room</option>
              <option value="shared">Shared Room</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--glass-text-muted)] ml-1 mb-1 block">Bedrooms</label>
            <select 
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/5 border border-[var(--glass-border)] text-[var(--glass-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--glass-text-muted)] ml-1 mb-1 block">Sort By</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/5 border border-[var(--glass-border)] text-[var(--glass-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Listings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[350px] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-400 mb-4">Failed to load listings</p>
          <GlassButton onClick={() => mutate()} size="sm">Try Again</GlassButton>
        </div>
      ) : data?.listings?.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-[var(--glass-border)]">
          <p className="text-xl font-semibold text-[var(--glass-text)] mb-2">No listings found</p>
          <p className="text-[var(--glass-text-muted)] mb-6">Try adjusting your filters or search for a different city</p>
          <GlassButton onClick={() => {
            setCity("");
            setMinPrice("");
            setMaxPrice("");
            setRoomType("");
            setBedrooms("");
          }}>
            Clear Filters
          </GlassButton>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.listings?.map((listing: Listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {/* Pagination */}
          {data?.pagination?.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <GlassButton 
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                variant="secondary"
                size="sm"
              >
                Previous
              </GlassButton>
              <span className="text-[var(--glass-text)] font-medium">
                Page {page} of {data.pagination.totalPages}
              </span>
              <GlassButton 
                onClick={() => handlePageChange(page + 1)}
                disabled={page === data.pagination.totalPages}
                variant="secondary"
                size="sm"
              >
                Next
              </GlassButton>
            </div>
          )}
        </>
      )}

      <AddListingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => mutate()} 
      />
    </div>
  );
}
