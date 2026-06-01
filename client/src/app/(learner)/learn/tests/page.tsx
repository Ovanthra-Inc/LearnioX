"use client";

import Link from "next/link";
import { FileQuestion, Clock, CheckCircle2, ArrowRight } from "lucide-react";

const MOCK_TESTS = [
  {
    id: "quiz-python-1",
    title: "Core Python Syntax & Memory Internals",
    courseTitle: "Advanced Python for Data Science",
    questions: 10,
    durationMinutes: 15,
    status: "pending",
  },
  {
    id: "quiz-react-1",
    title: "React Component Archetype & Lifecycle",
    courseTitle: "Design Systems in React",
    questions: 5,
    durationMinutes: 10,
    status: "completed",
    grade: "90%",
  },
  {
    id: "quiz-ux-1",
    title: "Typography and Layout Grid Alignment",
    courseTitle: "Foundations of Structural UI Design",
    questions: 8,
    durationMinutes: 12,
    status: "pending",
  }
];

export default function LearnerTestsPage() {
  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-foreground">Tests & Quizzes</h1>
        <p className="text-body-sm text-muted-foreground mt-1 uppercase tracking-wider text-label-md">
          Assess your course completion metrics
        </p>
      </div>

      {/* Tests Table List */}
      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-left text-body-sm min-w-[600px] border-collapse">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="p-4 text-label-sm uppercase tracking-widest text-muted-foreground font-bold">Exam Details</th>
              <th className="p-4 text-label-sm uppercase tracking-widest text-muted-foreground font-bold">Program</th>
              <th className="p-4 text-label-sm uppercase tracking-widest text-muted-foreground font-bold">Time Limit</th>
              <th className="p-4 text-label-sm uppercase tracking-widest text-muted-foreground font-bold">Status</th>
              <th className="p-4 w-[160px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {MOCK_TESTS.map((test) => (
              <tr key={test.id} className="hover:bg-surface-container-low transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 border border-border bg-surface flex items-center justify-center flex-shrink-0 text-foreground">
                    <FileQuestion className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground leading-snug">{test.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{test.questions} Questions</p>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{test.courseTitle}</td>
                <td className="p-4 text-muted-foreground font-mono flex items-center gap-1 mt-3.5"><Clock className="w-4 h-4" /> {test.durationMinutes} min</td>
                <td className="p-4">
                  {test.status === "completed" ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 fill-emerald-100" /> Finished ({test.grade})
                    </span>
                  ) : (
                    <span className="text-amber-600 font-semibold uppercase tracking-wider text-[10px] border border-amber-200 bg-amber-50 px-2 py-0.5">
                      Pending
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {test.status === "completed" ? (
                    <button disabled className="text-label-sm uppercase font-bold text-muted-foreground cursor-not-allowed">
                      Completed
                    </button>
                  ) : (
                    <Link
                      href={`/learn/quiz/${test.id}`}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-85"
                    >
                      Start <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
