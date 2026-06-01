"use client";

import Link from "next/link";
import { MOCK_LEARNERS } from "@/lib/mock-data/users";
import { Users, Search, ArrowRight, UserCheck } from "lucide-react";

const STUDENT_METRICS = [
  { id: "learner-2", progress: 68, activeDays: 24, lastActive: "1 day ago" },
  { id: "learner-3", progress: 42, activeDays: 12, lastActive: "3 days ago" },
  { id: "learner-4", progress: 85, activeDays: 45, lastActive: "Just now" }
];

export default function StudioStudentsPage() {
  const studentsList = MOCK_LEARNERS.map((learner) => {
    const metrics = STUDENT_METRICS.find((m) => `learner-${m.id.split("-")[1]}` === learner.id) || {
      progress: 0,
      activeDays: 0,
      lastActive: "Never",
    };
    return {
      ...learner,
      ...metrics,
    };
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-foreground">Academy Students</h1>
        <p className="text-body-sm text-muted-foreground mt-1 uppercase tracking-wider text-label-md">
          Monitor your academy's active learners and completion benchmarks
        </p>
      </div>

      {/* Directory Table */}
      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-left text-body-sm min-w-[600px] border-collapse">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="p-4 text-label-sm uppercase tracking-widest text-muted-foreground font-bold">Student Name</th>
              <th className="p-4 text-label-sm uppercase tracking-widest text-muted-foreground font-bold">Status</th>
              <th className="p-4 text-label-sm uppercase tracking-widest text-muted-foreground font-bold">Syllabus Progress</th>
              <th className="p-4 text-label-sm uppercase tracking-widest text-muted-foreground font-bold">Active Days</th>
              <th className="p-4 text-label-sm uppercase tracking-widest text-muted-foreground font-bold">Last Online</th>
              <th className="p-4 w-[160px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {studentsList.map((st) => (
              <tr key={st.id} className="hover:bg-surface-container-low transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 border border-border bg-surface flex items-center justify-center flex-shrink-0 text-foreground text-xs font-bold font-mono">
                    {st.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-foreground leading-snug">{st.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{st.email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 border border-emerald-200 bg-emerald-50 px-2 py-0.5">
                    {st.status}
                  </span>
                </td>
                <td className="p-4 font-mono font-bold text-foreground">{st.progress}% Complete</td>
                <td className="p-4 text-muted-foreground font-mono">{st.activeDays} Days</td>
                <td className="p-4 text-muted-foreground">{st.lastActive}</td>
                <td className="p-4 text-right">
                  <Link
                    href={`/studio/students/${st.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-border text-label-sm uppercase tracking-wider font-bold text-foreground hover:bg-surface-container transition-colors"
                  >
                    View Record <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
