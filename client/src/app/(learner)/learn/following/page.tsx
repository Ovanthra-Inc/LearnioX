"use client";

import Link from "next/link";
import { MOCK_INSTITUTIONS } from "@/lib/mock-data/institutions";
import { Building2, ArrowRight, Star } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function LearnerFollowingPage() {
  // Mock followed institutions
  const followed = MOCK_INSTITUTIONS.slice(0, 2);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-foreground">Followed Academies</h1>
        <p className="text-body-sm text-muted-foreground mt-1 uppercase tracking-wider text-label-md">
          Institutions you are currently following
        </p>
      </div>

      {/* Grid */}
      {followed.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {followed.map((inst) => (
            <div key={inst.id} className="border border-border bg-card p-6 flex flex-col justify-between space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {inst.name.charAt(0)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-body-md font-bold text-foreground leading-snug">{inst.name}</h3>
                    {inst.isVerified && <span className="text-[10px] text-emerald-600 font-bold">✓ Verified</span>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{inst.tagline}</p>
                </div>
              </div>

              {/* Stats & Link */}
              <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex gap-4 font-mono">
                  <span>{formatNumber(inst.studentCount)} students</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-current text-foreground" /> {inst.rating}</span>
                </div>
                <Link
                  href={`/c/${inst.slug}`}
                  className="font-bold uppercase tracking-wider text-foreground hover:underline flex items-center gap-1"
                >
                  Visit Channel <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-border p-16 text-center text-muted-foreground space-y-4 max-w-xl mx-auto">
          <Building2 className="w-12 h-12 mx-auto opacity-40 text-foreground" />
          <h3 className="text-headline-sm font-bold text-foreground">Not following any academies</h3>
          <p className="text-body-sm text-muted-foreground">
            Follow institutions to see their latest programs, announcements, and live batches on your dashboard.
          </p>
          <Link
            href="/institutions"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90"
          >
            Browse Institutions
          </Link>
        </div>
      )}
    </div>
  );
}
