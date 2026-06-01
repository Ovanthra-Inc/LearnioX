"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Building2, CheckCircle2, Star, Users, BookOpen } from "lucide-react";
import { MOCK_INSTITUTIONS } from "@/lib/mock-data/institutions";
import { formatNumber } from "@/lib/utils";

export default function InstitutionsDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInstitutions = MOCK_INSTITUTIONS.filter((inst) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      inst.name.toLowerCase().includes(query) ||
      inst.tagline.toLowerCase().includes(query) ||
      inst.categories.some(c => c.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto px-6 py-8 font-sans">
      
      {/* Header Banner */}
      <div className="border border-border bg-card p-6 md:p-10 flex flex-col items-center justify-center space-y-4">
        <h1 className="text-headline-md md:text-headline-lg font-bold text-foreground text-center uppercase tracking-tight">
          Coaching Institutions
        </h1>
        <p className="text-body-md text-muted-foreground max-w-lg text-center">
          Browse specialized coaching academies, view their reviews, and enroll directly in their batches or memberships.
        </p>
        
        {/* Search */}
        <div className="w-full max-w-xl relative mt-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search academies by name, topic, or categories..."
            className="w-full pl-12 pr-4 py-3 border border-border bg-surface text-foreground font-sans focus:outline-none focus:border-foreground rounded-none shadow-none"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Directory Grid */}
      {filteredInstitutions.length === 0 ? (
        <div className="border border-border p-16 text-center text-muted-foreground bg-card">
          <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-body-lg font-bold uppercase tracking-wider">No institutions found</p>
          <p className="text-sm">Try resetting your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredInstitutions.map((inst) => (
            <div key={inst.id} className="border border-border bg-card p-6 flex flex-col justify-between hover:border-foreground/50 transition-colors">
              <div className="space-y-4">
                
                {/* Branding row */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 bg-surface-container border border-border flex items-center justify-center font-bold text-sm text-muted-foreground flex-shrink-0">
                      {inst.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-body-lg font-bold text-foreground flex items-center gap-1.5 leading-snug">
                        {inst.name}
                        {inst.isVerified && (
                          <CheckCircle2 className="w-4 h-4 text-foreground fill-foreground text-background inline" />
                        )}
                      </h2>
                      <p className="text-xs text-muted-foreground line-clamp-1">{inst.tagline}</p>
                    </div>
                  </div>
                  
                  <span className="text-[10px] border border-border px-2 py-0.5 uppercase font-mono tracking-wider text-muted-foreground bg-surface-container">
                    {inst.plan} Partner
                  </span>
                </div>

                {/* Description */}
                <p className="text-body-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {inst.description}
                </p>

                {/* Category tags */}
                <div className="flex flex-wrap gap-1.5">
                  {inst.categories.map((cat, i) => (
                    <span key={i} className="text-[10px] border border-border px-2 py-0.5 font-bold uppercase text-muted-foreground">
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Ledger metrics */}
                <div className="grid grid-cols-3 gap-0 border border-border text-center text-xs font-mono bg-surface">
                  <div className="py-2.5 border-r border-border flex flex-col items-center justify-center">
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
                      {inst.rating.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase mt-0.5">Rating</span>
                  </div>
                  <div className="py-2.5 border-r border-border flex flex-col items-center justify-center">
                    <span className="font-bold text-foreground">
                      {formatNumber(inst.studentCount)}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase mt-0.5">Students</span>
                  </div>
                  <div className="py-2.5 flex flex-col items-center justify-center">
                    <span className="font-bold text-foreground">
                      {inst.courseCount}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase mt-0.5">Courses</span>
                  </div>
                </div>

              </div>

              {/* Action row */}
              <div className="pt-6 mt-4 border-t border-border flex justify-end">
                <Link
                  href={`/c/${inst.slug}`}
                  className="px-5 py-2.5 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
                >
                  View Profile & Catalog
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
