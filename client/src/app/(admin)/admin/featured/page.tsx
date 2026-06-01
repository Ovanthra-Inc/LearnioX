"use client";

import { useState } from "react";
import { Star, Search, Plus, Trash2, ArrowUp, ArrowDown, Check, Save } from "lucide-react";
import { MOCK_COURSES } from "@/lib/mock-data/courses";

interface FeaturedItem {
  id: string;
  courseId: string;
  title: string;
  institutionName: string;
  badgeText: string;
  imageUrl: string;
  order: number;
}

export default function AdminFeaturedPage() {
  const [featured, setFeatured] = useState<FeaturedItem[]>([
    {
      id: "feat-1",
      courseId: "course-3",
      title: "Advanced UI/UX Architecture",
      institutionName: "Design Institute",
      badgeText: "POPULAR",
      imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&q=80",
      order: 1,
    },
    {
      id: "feat-2",
      courseId: "course-4",
      title: "Design Systems in React",
      institutionName: "Design Institute",
      badgeText: "FEATURED",
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
      order: 2,
    },
  ]);

  const [search, setSearch] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Search catalog to feature
  const searchResults = MOCK_COURSES.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) &&
      !featured.some((f) => f.courseId === c.id)
  );

  const handleAddFeatured = (courseId: string) => {
    const course = MOCK_COURSES.find((c) => c.id === courseId);
    if (!course) return;

    const newItem: FeaturedItem = {
      id: `feat-${Date.now()}`,
      courseId: course.id,
      title: course.title,
      institutionName: course.institutionName,
      badgeText: "NEW",
      imageUrl: course.thumbnail || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
      order: featured.length + 1,
    };

    setFeatured([...featured, newItem]);
    setSearch("");
  };

  const handleRemove = (id: string) => {
    const updated = featured
      .filter((f) => f.id !== id)
      .map((f, index) => ({ ...f, order: index + 1 }));
    setFeatured(updated);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === featured.length - 1) return;

    const swapWithIndex = direction === "up" ? index - 1 : index + 1;
    const items = [...featured];

    // Swap items
    const temp = items[index];
    items[index] = items[swapWithIndex];
    items[swapWithIndex] = temp;

    // Recalculate order index
    const ordered = items.map((f, idx) => ({ ...f, order: idx + 1 }));
    setFeatured(ordered);
  };

  const handleSaveConfig = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Featured Banners</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Pin selected courses to the marketplace homepage slider carousel and define badge prompts.
          </p>
        </div>
        <button
          onClick={handleSaveConfig}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-85 transition-opacity"
        >
          <Save className="w-4 h-4" />
          Save Carousel Layout
        </button>
      </div>

      {saveSuccess && (
        <div className="border border-foreground p-4 bg-surface-container flex items-center gap-2 text-body-sm font-semibold">
          <Check className="w-5 h-5 text-foreground" />
          Marketplace featured carousel order updated successfully.
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Carousel Slot Editor */}
        <div className="lg:col-span-2 border border-border p-6 space-y-6">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">Active Highlights</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Order of active marketplace highlights</p>
          </div>

          <div className="space-y-4">
            {featured.map((item, index) => (
              <div
                key={item.id}
                className="border border-border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface"
              >
                <div className="flex items-start gap-4">
                  <div className="w-20 aspect-video bg-surface-container border border-border flex-shrink-0 relative overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover grayscale"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase bg-foreground text-background px-1 py-0.5">
                        Slot {item.order}
                      </span>
                      <input
                        type="text"
                        value={item.badgeText}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setFeatured(
                            featured.map((f) => (f.id === item.id ? { ...f, badgeText: val } : f))
                          );
                        }}
                        placeholder="BADGE TEXT"
                        className="p-0.5 bg-background border border-border text-[9px] font-mono outline-none w-20 text-center"
                      />
                    </div>
                    <h4 className="text-body-sm font-bold text-foreground mt-2">{item.title}</h4>
                    <p className="text-label-xs text-muted-foreground uppercase mt-0.5">
                      {item.institutionName}
                    </p>
                  </div>
                </div>

                {/* Move & Remove Controls */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className="p-2 border border-border hover:border-foreground disabled:opacity-30 disabled:hover:border-border text-foreground transition-all"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(index, "down")}
                    disabled={index === featured.length - 1}
                    className="p-2 border border-border hover:border-foreground disabled:opacity-30 disabled:hover:border-border text-foreground transition-all"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search catalog sidebar */}
        <div className="border border-border p-6 space-y-6 h-fit">
          <div>
            <h3 className="text-headline-sm font-bold text-foreground">Add to Carousel</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Pin course to home slider</p>
          </div>

          <div className="relative w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search catalog courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
            />
          </div>

          {search && (
            <div className="border border-border divide-y divide-border max-h-60 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-body-sm text-muted-foreground">
                  No products available.
                </div>
              ) : (
                searchResults.map((course) => (
                  <div
                    key={course.id}
                    className="p-3 flex justify-between items-center hover:bg-surface-container transition-colors text-body-sm"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-foreground truncate">{course.title}</p>
                      <p className="text-label-xs text-muted-foreground uppercase">
                        {course.institutionName}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddFeatured(course.id)}
                      className="flex-shrink-0 p-1.5 border border-border hover:border-foreground text-foreground"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
