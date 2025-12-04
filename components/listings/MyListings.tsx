"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import MyListingCard from "./MyListingCard";
import AddListingModal from "./AddListingModal";
import { Listing } from "@/lib/types";

export default function MyListings() {
  const { data: session, status } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 6;

  // Filter state
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const fetchListings = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        userId: session.user.id,
        status: statusFilter,
        page: page.toString(),
        limit: LIMIT.toString(),
        sortBy: sortBy
      });

      const res = await fetch(`/api/listings?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch listings");
      
      const data = await res.json();
      setListings(data.listings);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, page, statusFilter, sortBy]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchListings();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchListings]);

  if (status === "loading") {
    return <div className="text-[var(--glass-text)]">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--glass-text)]">My Listings</h2>
          <p className="text-[var(--glass-text-muted)]">Manage your property listings</p>
        </div>
        <GlassButton 
          variant="primary" 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <span>+</span> New Listing
        </GlassButton>
      </div>

      <div className="flex flex-wrap gap-4 bg-white/5 p-4 rounded-xl border border-[var(--glass-border)]">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--glass-text-muted)] uppercase font-bold">Status</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/20 border border-[var(--glass-border)] rounded-lg px-3 py-1 text-[var(--glass-text)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Listings</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--glass-text-muted)] uppercase font-bold">Sort By</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-black/20 border border-[var(--glass-border)] rounded-lg px-3 py-1 text-[var(--glass-text)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <GlassCard key={i} className="h-[350px] animate-pulse bg-gray-800/20">
                <div />
            </GlassCard>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <GlassCard className="text-center py-12">
          <div className="mb-4 text-4xl">🏠</div>
          <h3 className="text-xl font-bold text-[var(--glass-text)] mb-2">No listings yet</h3>
          <p className="text-[var(--glass-text-muted)] mb-6">
            You haven&apos;t created any property listings yet.
          </p>
          <GlassButton variant="primary" onClick={() => setIsModalOpen(true)}>
            Create Your First Listing
          </GlassButton>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <MyListingCard 
                key={listing.id} 
                listing={listing} 
                // onEdit={(l) => console.log("Edit", l)}
                // onDelete={(id) => console.log("Delete", id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <GlassButton
                size="sm"
                variant="secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={page === 1 ? "opacity-50 cursor-not-allowed" : ""}
              >
                Previous
              </GlassButton>
              <span className="flex items-center px-4 text-[var(--glass-text)]">
                Page {page} of {totalPages}
              </span>
              <GlassButton
                size="sm"
                variant="secondary"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={page === totalPages ? "opacity-50 cursor-not-allowed" : ""}
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
        onSuccess={() => {
            fetchListings();
        }}
      />
    </div>
  );
}
