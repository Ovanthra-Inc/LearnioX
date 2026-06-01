"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Check, ArrowRight } from "lucide-react";

export default function StudioAssignmentsPage() {
  const [assignments, setAssignments] = useState([
    { id: "a1", title: "Optimizing Nested Loops with Vectorized NumPy", course: "Advanced Python for Data Science", due: "June 15, 2026" },
    { id: "a2", title: "Storybook Layout Component Build", course: "Design Systems in React", due: "May 20, 2026" }
  ]);
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("Advanced Python for Data Science");
  const [due, setDue] = useState("June 20, 2026");
  const [isSaved, setIsSaved] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setAssignments([
      ...assignments,
      { id: `as-${Date.now()}`, title, course, due }
    ]);
    setTitle("");
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Assignment Builder</h1>
          <p className="text-body-sm text-muted-foreground mt-1 uppercase tracking-wider text-label-md">
            Publish written worksheets and practical homework labs
          </p>
        </div>
        <Link
          href="/studio/assignments/review"
          className="px-5 py-2.5 border border-border hover:border-foreground transition-colors text-label-sm uppercase tracking-wider font-bold flex items-center gap-1.5 text-foreground"
        >
          Review Submissions <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {isSaved && (
        <div className="p-4 border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> Assignment coursework templates created successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Assignments list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Active Homework Worksheets</h3>
          <div className="space-y-4">
            {assignments.map((as) => (
              <div key={as.id} className="border border-border bg-card p-5 flex items-center justify-between">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 border border-border bg-surface flex items-center justify-center flex-shrink-0 text-foreground">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground leading-snug">{as.title}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">{as.course} • Due {as.due}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="border border-border bg-card p-5 space-y-4">
          <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">Publish Assignment</h3>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Assignment Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Loop Vectorization..."
                className="w-full p-2.5 border border-border bg-surface text-foreground font-sans text-xs focus:outline-none focus:border-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Associated Program</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full p-2.5 border border-border bg-surface text-foreground font-sans text-xs focus:outline-none"
              >
                <option value="Advanced Python for Data Science">Advanced Python for Data Science</option>
                <option value="Design Systems in React">Design Systems in React</option>
                <option value="Foundations of Structural UI Design">Foundations of Structural UI Design</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Due Date</label>
              <input
                type="text"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="w-full p-2.5 border border-border bg-surface text-foreground font-sans text-xs focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full py-2.5 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Publish Worksheet
          </button>
        </form>
      </div>
    </div>
  );
}
