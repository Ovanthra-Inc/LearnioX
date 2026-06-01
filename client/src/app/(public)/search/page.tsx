"use client";

import { useState, useMemo, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { CourseCard } from "@/components/shared/course-card";
import { SectionHeader } from "@/components/shared/section-header";
import { MOCK_COURSES, MOCK_CATEGORIES } from "@/lib/mock-data/courses";
import type { DifficultyLevel } from "@/types/common";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<DifficultyLevel[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]); // "free" | "paid"
  const [sortBy, setSortBy] = useState("popular");

  // Reset Filters
  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedLevels([]);
    setSelectedPrices([]);
    setSearchQuery("");
  };

  // Filter & Sort Logic
  const filteredCourses = useMemo(() => {
    return MOCK_COURSES.filter((course) => {
      // 1. Text Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = course.title.toLowerCase().includes(query);
        const matchesDesc = course.description.toLowerCase().includes(query);
        const matchesShortDesc = course.shortDescription.toLowerCase().includes(query);
        const matchesInstitution = course.institutionName.toLowerCase().includes(query);
        const matchesTags = course.tags.some(t => t.toLowerCase().includes(query));
        
        if (!matchesTitle && !matchesDesc && !matchesShortDesc && !matchesInstitution && !matchesTags) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(course.categoryId)) {
          return false;
        }
      }

      // 3. Level Filter
      if (selectedLevels.length > 0) {
        if (!selectedLevels.includes(course.level)) {
          return false;
        }
      }

      // 4. Price Filter
      if (selectedPrices.length > 0) {
        const isFree = course.pricingType === "free";
        const matchesFree = selectedPrices.includes("free") && isFree;
        const matchesPaid = selectedPrices.includes("paid") && !isFree;
        if (!matchesFree && !matchesPaid) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sorting
      if (sortBy === "popular") {
        return b.enrollmentCount - a.enrollmentCount;
      }
      if (sortBy === "rating") {
        return b.rating - a.rating;
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "price-low") {
        const priceA = a.pricingType === "free" ? 0 : (a.price || 0);
        const priceB = b.pricingType === "free" ? 0 : (b.price || 0);
        return priceA - priceB;
      }
      if (sortBy === "price-high") {
        const priceA = a.pricingType === "free" ? 0 : (a.price || 0);
        const priceB = b.pricingType === "free" ? 0 : (b.price || 0);
        return priceB - priceA;
      }
      return 0;
    });
  }, [searchQuery, selectedCategories, selectedLevels, selectedPrices, sortBy]);

  // Handlers for checkboxes
  const handleCategoryToggle = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleLevelToggle = (level: DifficultyLevel) => {
    setSelectedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const handlePriceToggle = (price: string) => {
    setSelectedPrices(prev =>
      prev.includes(price) ? prev.filter(p => p !== price) : [...prev, price]
    );
  };

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto px-6 py-8">
      {/* Search Input Hero Section */}
      <div className="border border-border bg-card p-6 md:p-10 flex flex-col items-center justify-center space-y-4">
        <h1 className="text-headline-md md:text-headline-lg font-bold text-foreground text-center uppercase tracking-tight">
          Explore Courses
        </h1>
        <p className="text-body-md text-muted-foreground max-w-lg text-center">
          Find live batches, specialized subjects, and memberships from trusted coaching institutions.
        </p>
        <div className="w-full max-w-2xl relative mt-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic, course title, code, or institution..."
            className="w-full pl-12 pr-4 py-4 border border-border bg-surface text-foreground font-sans focus:outline-none focus:border-foreground rounded-none shadow-none text-body-md"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-foreground text-muted-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Results Area */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Filters Column */}
        <div className="w-full lg:w-64 space-y-6 flex-shrink-0">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <span className="flex items-center gap-2 text-label-md font-bold uppercase tracking-wider text-foreground">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </span>
            {(selectedCategories.length > 0 || selectedLevels.length > 0 || selectedPrices.length > 0 || searchQuery) && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Pricing Filter */}
          <div className="space-y-3">
            <h4 className="text-label-sm font-bold uppercase tracking-widest text-muted-foreground">Price Type</h4>
            <div className="space-y-2">
              {["paid", "free"].map((price) => (
                <label key={price} className="flex items-center gap-2 text-body-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPrices.includes(price)}
                    onChange={() => handlePriceToggle(price)}
                    className="w-4 h-4 accent-foreground border-border rounded-none"
                  />
                  <span className="capitalize">{price}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Categories Filter */}
          <div className="space-y-3">
            <h4 className="text-label-sm font-bold uppercase tracking-widest text-muted-foreground">Category</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {MOCK_CATEGORIES.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 text-body-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => handleCategoryToggle(cat.id)}
                    className="w-4 h-4 accent-foreground border-border rounded-none"
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Difficulty Level Filter */}
          <div className="space-y-3">
            <h4 className="text-label-sm font-bold uppercase tracking-widest text-muted-foreground">Level</h4>
            <div className="space-y-2">
              {(["beginner", "intermediate", "advanced", "expert"] as DifficultyLevel[]).map((level) => (
                <label key={level} className="flex items-center gap-2 text-body-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLevels.includes(level)}
                    onChange={() => handleLevelToggle(level)}
                    className="w-4 h-4 accent-foreground border-border rounded-none"
                  />
                  <span className="capitalize">{level}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Results Grid */}
        <div className="flex-1 space-y-6">
          {/* Grid control bar */}
          <div className="flex justify-between items-center border border-border bg-card p-4">
            <span className="text-body-sm text-muted-foreground">
              Showing <strong className="text-foreground font-bold">{filteredCourses.length}</strong> results
            </span>
            
            <div className="flex items-center gap-2">
              <span className="text-label-sm text-muted-foreground uppercase tracking-wider">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-surface text-body-sm text-foreground p-2 border border-border rounded-none focus:outline-none focus:border-foreground"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest Releases</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Course Card Grid */}
          {filteredCourses.length === 0 ? (
            <div className="border border-border p-16 text-center space-y-4">
              <p className="text-body-lg font-bold uppercase text-muted-foreground tracking-wider">No Courses Found</p>
              <p className="text-body-sm text-muted-foreground max-w-sm mx-auto">
                We couldn't find any courses matching your filters. Try clearing your filters or search keywords.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-6 py-2.5 bg-foreground text-background text-label-md uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-muted-foreground uppercase tracking-widest font-mono">Loading Search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
