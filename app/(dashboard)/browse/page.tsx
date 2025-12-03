"use client";

import { useState, useEffect, useCallback } from "react";
import SearchFilters from "@/components/search/SearchFilters";
import UserCard from "@/components/search/UserCard";
import GlassButton from "@/components/ui/glass/GlassButton";

export default function BrowsePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchUsers = useCallback(async (currentFilters: any, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...Object.entries(currentFilters).reduce((acc, [key, val]) => {
            if (val) acc[key] = String(val);
            return acc;
        }, {} as Record<string, string>)
      });

      const res = await fetch(`/api/users/search?${params}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setUsers(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and filter changes
  useEffect(() => {
    fetchUsers(filters, 1);
  }, [filters, fetchUsers]);

  const handlePageChange = (newPage: number) => {
    fetchUsers(filters, newPage);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-[var(--glass-text)]">Browse Roommates</h1>
            <p className="text-[var(--glass-text-muted)]">Find your perfect match from our community.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Filters */}
        <div className="lg:col-span-1">
          <SearchFilters onFilterChange={setFilters} />
        </div>

        {/* Right Content: Grid */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-[350px] rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-4 mt-8">
                  <GlassButton
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    variant="secondary"
                  >
                    Previous
                  </GlassButton>
                  <span className="flex items-center text-[var(--glass-text)]">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <GlassButton
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    variant="secondary"
                  >
                    Next
                  </GlassButton>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-[var(--glass-text)]">No users found</h3>
                <p className="text-[var(--glass-text-muted)] mt-2">Try adjusting your filters to see more results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}