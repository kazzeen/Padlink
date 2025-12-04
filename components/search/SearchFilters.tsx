"use client";

import { useState, useEffect } from "react";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassInput from "@/components/ui/glass/GlassInput";
import { useDebounce } from "@/lib/hooks/useDebounce"; // We'll create this hook

interface SearchFiltersProps {
  onFilterChange: (filters: Record<string, unknown>) => void;
}

export default function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [sort, setSort] = useState("newest");

  const debouncedQuery = useDebounce(query, 500);
  const debouncedCity = useDebounce(city, 500);
  const debouncedMinBudget = useDebounce(minBudget, 500);
  const debouncedMaxBudget = useDebounce(maxBudget, 500);

  useEffect(() => {
    onFilterChange({
      query: debouncedQuery,
      city: debouncedCity,
      minBudget: debouncedMinBudget,
      maxBudget: debouncedMaxBudget,
      sort,
    });
  }, [debouncedQuery, debouncedCity, debouncedMinBudget, debouncedMaxBudget, sort, onFilterChange]);

  return (
    <GlassCard className="p-6 space-y-6 sticky top-4">
      <h2 className="text-xl font-bold text-[var(--glass-text)]">Filters</h2>
      
      {/* Text Search */}
      <GlassInput
        placeholder="Search name or bio..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* City */}
      <GlassInput
        placeholder="Preferred City..."
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

      {/* Budget Range */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--glass-text)]">Budget Range</label>
        <div className="flex gap-2">
          <GlassInput
            type="number"
            placeholder="Min"
            value={minBudget}
            onChange={(e) => setMinBudget(e.target.value)}
          />
          <GlassInput
            type="number"
            placeholder="Max"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
          />
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--glass-text)]">Sort By</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full px-4 py-3 rounded-xl glass-input bg-transparent text-[var(--glass-text)] focus:outline-none"
        >
          <option value="newest" className="text-black">Newest Members</option>
          <option value="budget_asc" className="text-black">Budget (Low to High)</option>
          <option value="budget_desc" className="text-black">Budget (High to Low)</option>
        </select>
      </div>
    </GlassCard>
  );
}