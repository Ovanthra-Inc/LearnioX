"use client";

import Link from "next/link";
import { ClipboardList, Calendar, CheckCircle2, ArrowRight } from "lucide-react";

const MOCK_ASSIGNMENTS = [
  {
    id: "assign-python-1",
    title: "Optimizing Nested Loops with Vectorized NumPy",
    courseTitle: "Advanced Python for Data Science",
    dueDate: "2026-06-15",
    status: "pending",
  },
  {
    id: "assign-react-1",
    title: "Storybook Layout Component Build",
    courseTitle: "Design Systems in React",
    dueDate: "2026-05-20",
    status: "graded",
    grade: "A-",
    score: "92/100",
  },
  {
    id: "assign-ux-1",
    title: "Grayscale High-Fidelity Wireframes Sandbox",
    courseTitle: "Foundations of Structural UI Design",
    dueDate: "2026-06-05",
    status: "submitted",
  }
];

export default function LearnerAssignmentsPage() {
  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-foreground">Assignments</h1>
        <p className="text-body-sm text-muted-foreground mt-1 uppercase tracking-wider text-label-md">
          View assigned worksheets and submit your coursework
        </p>
      </div>

      {/* List */}
      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-left text-body-sm min-w-[600px] border-collapse">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="p-4 text-label-sm uppercase tracking-widest text-muted-foreground font-bold">Assignment</th>
              <th className="p-4 text-label-sm uppercase tracking-widest text-muted-foreground font-bold">Program</th>
              <th className="p-4 text-label-sm uppercase tracking-widest text-muted-foreground font-bold">Due Date</th>
              <th className="p-4 text-label-sm uppercase tracking-widest text-muted-foreground font-bold">Status</th>
              <th className="p-4 w-[160px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {MOCK_ASSIGNMENTS.map((assign) => (
              <tr key={assign.id} className="hover:bg-surface-container-low transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 border border-border bg-surface flex items-center justify-center flex-shrink-0 text-foreground">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground leading-snug">{assign.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase mt-0.5">Worksheet Lab</p>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{assign.courseTitle}</td>
                <td className="p-4 text-muted-foreground font-mono flex items-center gap-1.5 mt-3.5">
                  <Calendar className="w-4 h-4" /> {new Date(assign.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
                <td className="p-4">
                  {assign.status === "graded" && (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 fill-emerald-100" /> Graded ({assign.grade})
                    </span>
                  )}
                  {assign.status === "submitted" && (
                    <span className="text-foreground/60 font-semibold uppercase tracking-wider text-[10px] border border-border bg-surface-container px-2 py-0.5">
                      Submitted
                    </span>
                  )}
                  {assign.status === "pending" && (
                    <span className="text-amber-600 font-semibold uppercase tracking-wider text-[10px] border border-amber-200 bg-amber-50 px-2 py-0.5">
                      Assigned
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <Link
                    href={`/learn/assignments/${assign.id}`}
                    className="inline-flex items-center gap-1 px-4 py-2 border border-border text-label-sm uppercase tracking-wider font-bold text-foreground hover:bg-surface-container transition-colors"
                  >
                    Open <ArrowRight className="w-3.5 h-3.5" />
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
