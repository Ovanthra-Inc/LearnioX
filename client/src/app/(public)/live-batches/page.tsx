"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Calendar, Clock, Hourglass, Users, Filter, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LiveBatch {
  id: string;
  title: string;
  institution: string;
  instructor: string;
  price: number;
  startDate: string;
  durationWeeks: number;
  scheduleDays: string;
  scheduleTime: string;
  seatsLeft: number;
  category: "data-science" | "software-engineering" | "design";
  level: "beginner" | "intermediate" | "advanced";
  timeframe: "7d" | "this-month" | "later";
}

export default function LiveBatchesListingPage() {
  const [batches] = useState<LiveBatch[]>([
    {
      id: "python-arch",
      title: "Advanced Python & Architecture",
      institution: "TechGlobal Institute",
      instructor: "Alan Turing",
      price: 24999,
      startDate: "Starting in 3 days",
      durationWeeks: 12,
      scheduleDays: "Mon, Wed, Fri",
      scheduleTime: "18:00 - 20:00 IST",
      seatsLeft: 4,
      category: "software-engineering",
      level: "advanced",
      timeframe: "7d",
    },
    {
      id: "design-systems-mastery",
      title: "UI/UX Design Systems Mastery",
      institution: "Design Institute",
      instructor: "Dieter Rams",
      price: 32500,
      startDate: "Starting next week",
      durationWeeks: 8,
      scheduleDays: "Tue, Thu",
      scheduleTime: "10:00 - 13:00 IST",
      seatsLeft: 12,
      category: "design",
      level: "advanced",
      timeframe: "this-month",
    },
    {
      id: "data-science-bootcamp",
      title: "Data Science & ML Foundation",
      institution: "DataSys Academy",
      instructor: "Grace Hopper",
      price: 19999,
      startDate: "Starting next month",
      durationWeeks: 10,
      scheduleDays: "Sat, Sun",
      scheduleTime: "09:00 - 12:00 IST",
      seatsLeft: 25,
      category: "data-science",
      level: "beginner",
      timeframe: "later",
    },
  ]);

  // Filters State
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string | null>(null);

  const toggleCategory = (cat: string) => {
    if (selectedCats.includes(cat)) {
      setSelectedCats(selectedCats.filter((c) => c !== cat));
    } else {
      setSelectedCats([...selectedCats, cat]);
    }
  };

  const toggleLevel = (lvl: string) => {
    if (selectedLevels.includes(lvl)) {
      setSelectedLevels(selectedLevels.filter((l) => l !== lvl));
    } else {
      setSelectedLevels([...selectedLevels, lvl]);
    }
  };

  const filteredBatches = batches.filter((b) => {
    if (selectedCats.length > 0 && !selectedCats.includes(b.category)) return false;
    if (selectedLevels.length > 0 && !selectedLevels.includes(b.level)) return false;
    if (selectedTimeframe && b.timeframe !== selectedTimeframe) return false;
    return true;
  });

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-12">
      {/* Hero Header */}
      <div className="border-b border-border pb-8 mb-12">
        <h1 className="text-headline-xl font-bold text-foreground">Join Live Learning Batches</h1>
        <p className="text-body-lg text-muted-foreground mt-2 max-w-3xl">
          Attend structured live classes from verified academies and instructors. High-contrast, rigorous professional learning environments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Filters (col-span-3) */}
        <aside className="lg:col-span-3 border border-border p-6 h-fit space-y-6 bg-surface">
          <div className="font-headline-sm font-bold text-foreground border-b border-border pb-3 flex justify-between items-center">
            Filters
            <Filter className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* Category */}
          <div className="space-y-3 border-b border-border pb-6">
            <h3 className="text-label-md font-bold uppercase text-foreground">Category</h3>
            <div className="space-y-2">
              {[
                { label: "Data Science", val: "data-science" },
                { label: "Software Engineering", val: "software-engineering" },
                { label: "Design", val: "design" },
              ].map((c) => (
                <label key={c.val} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCats.includes(c.val)}
                    onChange={() => toggleCategory(c.val)}
                    className="w-4 h-4 border-border text-foreground accent-foreground rounded-none cursor-pointer"
                  />
                  <span className="text-body-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {c.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Start Date Timeframe */}
          <div className="space-y-3 border-b border-border pb-6">
            <h3 className="text-label-md font-bold uppercase text-foreground">Start Date</h3>
            <div className="space-y-2">
              {[
                { label: "Next 7 Days", val: "7d" },
                { label: "This Month", val: "this-month" },
                { label: "Later", val: "later" },
              ].map((t) => (
                <label key={t.val} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="timeframe"
                    checked={selectedTimeframe === t.val}
                    onChange={() => setSelectedTimeframe(t.val)}
                    className="w-4 h-4 border-border text-foreground accent-foreground cursor-pointer"
                  />
                  <span className="text-body-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {t.label}
                  </span>
                </label>
              ))}
              {selectedTimeframe && (
                <button
                  onClick={() => setSelectedTimeframe(null)}
                  className="text-label-xs uppercase font-bold text-muted-foreground hover:text-foreground mt-2 block"
                >
                  Clear Timeframe
                </button>
              )}
            </div>
          </div>

          {/* Level */}
          <div className="space-y-3">
            <h3 className="text-label-md font-bold uppercase text-foreground">Difficulty Level</h3>
            <div className="space-y-2">
              {[
                { label: "Beginner", val: "beginner" },
                { label: "Intermediate", val: "intermediate" },
                { label: "Advanced", val: "advanced" },
              ].map((l) => (
                <label key={l.val} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedLevels.includes(l.val)}
                    onChange={() => toggleLevel(l.val)}
                    className="w-4 h-4 border-border text-foreground accent-foreground rounded-none cursor-pointer"
                  />
                  <span className="text-body-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {l.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Middle Listing (col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="border-b border-foreground pb-2 flex items-center justify-between">
            <h2 className="text-headline-sm font-bold text-foreground">Cohort Batches</h2>
            <span className="text-label-sm text-muted-foreground uppercase">
              {filteredBatches.length} items found
            </span>
          </div>

          <div className="space-y-6">
            {filteredBatches.length === 0 ? (
              <div className="p-8 border border-border text-center text-body-sm text-muted-foreground">
                No active cohorts found matching your filters.
              </div>
            ) : (
              filteredBatches.map((batch) => (
                <article
                  key={batch.id}
                  className="border border-border p-6 hover:border-foreground transition-colors bg-background flex flex-col gap-6"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                      <h3 className="text-headline-sm font-bold text-foreground">{batch.title}</h3>
                      <p className="text-body-sm text-muted-foreground mt-1">
                        {batch.institution} • Instructor {batch.instructor}
                      </p>
                    </div>
                    <span className="bg-foreground text-background text-label-xs font-bold uppercase tracking-wider px-2 py-1 h-fit self-start">
                      {batch.startDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-b border-border py-4">
                    <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 text-foreground" />
                      <span>{batch.scheduleDays}</span>
                    </div>
                    <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-foreground" />
                      <span>{batch.scheduleTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                      <Hourglass className="w-4 h-4 text-foreground" />
                      <span>{batch.durationWeeks} Weeks</span>
                    </div>
                    <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                      <Users className="w-4 h-4 text-foreground" />
                      <span className="font-semibold text-foreground">
                        {batch.seatsLeft} Seats Left
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <span className="text-headline-sm font-extrabold text-foreground">
                      {formatCurrency(batch.price)}
                    </span>
                    <div className="flex gap-3">
                      <Link
                        href={`/live-batches/${batch.id}`}
                        className="px-4 py-2 border border-border hover:border-foreground text-label-md uppercase tracking-wider font-bold transition-colors"
                      >
                        View Batch
                      </Link>
                      <Link
                        href={`/checkout/${batch.id}`}
                        className="px-4 py-2 bg-foreground text-background hover:opacity-85 text-label-md uppercase tracking-wider font-bold transition-opacity"
                      >
                        Enroll Now
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar (col-span-3) */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Calendar Widget */}
          <div className="border border-border p-6 bg-background space-y-4">
            <h3 className="text-label-md font-bold uppercase text-foreground border-b border-border pb-2">
              Upcoming Schedule
            </h3>
            {/* Simple Mock Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-label-xs font-bold text-muted-foreground pb-2">
              <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-body-sm text-foreground">
              <div className="text-muted-foreground/30">28</div>
              <div className="text-muted-foreground/30">29</div>
              <div className="text-muted-foreground/30">30</div>
              <div>1</div>
              <div>2</div>
              <div className="bg-foreground text-background font-bold">3</div>
              <div>4</div>
              <div>5</div>
              <div>6</div>
              <div className="border border-border font-bold">7</div>
              <div>8</div>
              <div>9</div>
              <div>10</div>
              <div>11</div>
            </div>
            <p className="text-label-xs text-muted-foreground italic text-center mt-2">
              Highlighting starting batches this week
            </p>
          </div>

          {/* Guidelines info */}
          <div className="border border-border p-6 bg-surface space-y-3">
            <h3 className="text-label-md font-bold uppercase text-foreground">Interactive Cohorts</h3>
            <p className="text-body-sm text-muted-foreground leading-relaxed">
              Every live batch has fixed intake caps to ensure rich Q&A interaction, priority evaluations, and direct doubt resolutions with creators.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
