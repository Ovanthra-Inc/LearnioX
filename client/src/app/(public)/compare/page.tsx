"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import { Star, Clock, Award, Check, X, ArrowRight } from "lucide-react";
import { formatCurrency, formatDuration } from "@/lib/utils";

export default function ComparePage() {
  const [course1Id, setCourse1Id] = useState(MOCK_COURSES[0].id);
  const [course2Id, setCourse2Id] = useState(MOCK_COURSES[2].id);

  const c1 = MOCK_COURSES.find((c) => c.id === course1Id) || MOCK_COURSES[0];
  const c2 = MOCK_COURSES.find((c) => c.id === course2Id) || MOCK_COURSES[1];

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-12 space-y-8 font-sans">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-surface-container border border-border px-3 py-1">
          Smart Compare
        </span>
        <h1 className="text-headline-lg font-bold text-foreground mt-4 leading-tight">
          Compare Programs
        </h1>
        <p className="text-body-md text-muted-foreground mt-2">
          Select and compare modules, pricing models, and outcomes of coaching programs side-by-side.
        </p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-border bg-surface">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">First Program</label>
          <select
            value={course1Id}
            onChange={(e) => setCourse1Id(e.target.value)}
            className="w-full p-3 border border-border bg-card text-foreground font-sans outline-none focus:border-foreground"
          >
            {MOCK_COURSES.map((c) => (
              <option key={c.id} value={c.id}>{c.title} — {c.institutionName}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Second Program</label>
          <select
            value={course2Id}
            onChange={(e) => setCourse2Id(e.target.value)}
            className="w-full p-3 border border-border bg-card text-foreground font-sans outline-none focus:border-foreground"
          >
            {MOCK_COURSES.map((c) => (
              <option key={c.id} value={c.id}>{c.title} — {c.institutionName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-left text-body-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="p-4 w-1/4 text-label-sm uppercase tracking-widest text-muted-foreground font-bold">Parameter</th>
              <th className="p-4 w-3/8 text-body-md font-bold text-foreground">{c1.title}</th>
              <th className="p-4 w-3/8 text-body-md font-bold text-foreground">{c2.title}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {/* Institution */}
            <tr>
              <td className="p-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Institution</td>
              <td className="p-4 font-medium text-foreground">{c1.institutionName}</td>
              <td className="p-4 font-medium text-foreground">{c2.institutionName}</td>
            </tr>

            {/* Level */}
            <tr>
              <td className="p-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Difficulty Level</td>
              <td className="p-4 capitalize">{c1.level}</td>
              <td className="p-4 capitalize">{c2.level}</td>
            </tr>

            {/* Price */}
            <tr>
              <td className="p-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Pricing</td>
              <td className="p-4 font-bold text-foreground">
                {c1.pricingType === "free" ? "Free" : formatCurrency(c1.price || 0)}
              </td>
              <td className="p-4 font-bold text-foreground">
                {c2.pricingType === "free" ? "Free" : formatCurrency(c2.price || 0)}
              </td>
            </tr>

            {/* Rating */}
            <tr>
              <td className="p-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Student Rating</td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <Star className="w-4 h-4 fill-foreground text-foreground" /> {c1.rating} ({c1.reviewCount} reviews)
                </span>
              </td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <Star className="w-4 h-4 fill-foreground text-foreground" /> {c2.rating} ({c2.reviewCount} reviews)
                </span>
              </td>
            </tr>

            {/* Duration */}
            <tr>
              <td className="p-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Total Duration</td>
              <td className="p-4 flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatDuration(c1.totalDuration)}</td>
              <td className="p-4 flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatDuration(c2.totalDuration)}</td>
            </tr>

            {/* Certificate */}
            <tr>
              <td className="p-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Degree Certificate</td>
              <td className="p-4">
                {c1.certificate ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1"><Check className="w-4 h-4" /> Yes</span>
                ) : (
                  <span className="text-muted-foreground/60 flex items-center gap-1"><X className="w-4 h-4" /> No</span>
                )}
              </td>
              <td className="p-4">
                {c2.certificate ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1"><Check className="w-4 h-4" /> Yes</span>
                ) : (
                  <span className="text-muted-foreground/60 flex items-center gap-1"><X className="w-4 h-4" /> No</span>
                )}
              </td>
            </tr>

            {/* Outcomes */}
            <tr>
              <td className="p-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Core Outcomes</td>
              <td className="p-4">
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-muted-foreground">
                  {c1.outcomes.map((o, idx) => <li key={idx}>{o}</li>)}
                </ul>
              </td>
              <td className="p-4">
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-muted-foreground">
                  {c2.outcomes.map((o, idx) => <li key={idx}>{o}</li>)}
                </ul>
              </td>
            </tr>

            {/* Action CTAs */}
            <tr className="bg-surface">
              <td className="p-4"></td>
              <td className="p-4">
                <Link
                  href={`/course/${c1.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90"
                >
                  View Details <ArrowRight className="w-4 h-4" />
                </Link>
              </td>
              <td className="p-4">
                <Link
                  href={`/course/${c2.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90"
                >
                  View Details <ArrowRight className="w-4 h-4" />
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
