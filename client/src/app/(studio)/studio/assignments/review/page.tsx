"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ClipboardList, ShieldCheck, Sparkles } from "lucide-react";

export default function StudioAssignmentReviewPage() {
  const [submissions, setSubmissions] = useState([
    { 
      id: "sub-1", 
      studentName: "Sarah J.", 
      title: "Grayscale High-Fidelity Wireframes Sandbox", 
      course: "Foundations of Structural UI Design", 
      date: "Yesterday", 
      status: "pending",
      submissionText: "I compiled the high-fidelity grayscale wireframes for the user onboarding, course builder, and checkout flows. I used standard B&W spacing tokens and sharp 0px borders."
    },
    { 
      id: "sub-2", 
      studentName: "Arjun Patel", 
      title: "Optimizing Nested Loops with Vectorized NumPy", 
      course: "Advanced Python for Data Science", 
      date: "2 days ago", 
      status: "pending",
      submissionText: "I converted the double for-loops inside coordinate calculation using NumPy meshgrid broadcasting. Profiler execution shows a latency gain of approximately 42x on the 1000x1000 array."
    }
  ]);

  const [activeSubId, setActiveSubId] = useState<string | null>(submissions[0]?.id || null);
  const [grade, setGrade] = useState("A");
  const [feedback, setFeedback] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubId) return;

    // Filter out graded submission
    setSubmissions(submissions.filter((s) => s.id !== activeSubId));
    setFeedback("");
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    // Switch active selection
    const remaining = submissions.filter((s) => s.id !== activeSubId);
    setActiveSubId(remaining[0]?.id || null);
  };

  const handleAiEvaluate = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      if (activeSubId === "sub-1") {
        setGrade("A+");
        setFeedback("Superb work, Sarah! Your grayscale wireframes are structurally consistent and map onboarding flows perfectly. Great adherence to design tokens.");
      } else if (activeSubId === "sub-2") {
        setGrade("A");
        setFeedback("Excellent vectorized loop optimization, Arjun! A 42x speed improvement on NumPy arrays validates the complexity reduction goals. Well done.");
      } else {
        setGrade("A");
        setFeedback("AI Evaluation complete: Code aligns with instructions and requirements. Good complexity structure.");
      }
      setIsEvaluating(false);
    }, 1100);
  };

  const selectedSub = submissions.find((s) => s.id === activeSubId);

  return (
    <div className="max-w-[900px] mx-auto py-6 font-sans space-y-6">
      {/* Navigation */}
      <div>
        <Link
          href="/studio/assignments"
          className="inline-flex items-center gap-2 text-label-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Builder
        </Link>
      </div>

      {/* Main Review Portal */}
      <div className="border border-border bg-card p-6 md:p-8 space-y-6">
        <div className="border-b border-border pb-4">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Grading Ledger</span>
          <h1 className="text-headline-sm font-bold text-foreground mt-0.5">Submission Evaluation Queue</h1>
        </div>

        {isSaved && (
          <div className="p-4 border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" /> Coursework grade registered on student dashboard.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Submissions queue */}
          <div className="space-y-4">
            <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Pending Review</h3>
            <div className="border border-border divide-y divide-border/60">
              {submissions.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setActiveSubId(sub.id);
                    setFeedback("");
                  }}
                  className={`w-full p-3.5 text-left text-body-sm transition-colors block ${
                    activeSubId === sub.id
                      ? "bg-surface-container font-bold border-l-2 border-foreground"
                      : "hover:bg-surface text-muted-foreground"
                  }`}
                >
                  <p className="font-bold text-foreground truncate">{sub.studentName}</p>
                  <p className="text-[10px] text-muted-foreground uppercase mt-0.5 truncate">{sub.course}</p>
                </button>
              ))}
              {submissions.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-xs bg-surface border-dashed border border-border">
                  Grading queue cleared! All homework graded.
                </div>
              )}
            </div>
          </div>

          {/* Right Evaluation card */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Grade Workspace</h3>
            {selectedSub ? (
              <form onSubmit={handleGrade} className="border border-border p-5 bg-surface space-y-5">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono font-bold">
                    Submitted {selectedSub.date}
                  </span>
                  <h4 className="text-body-md font-bold text-foreground leading-snug">{selectedSub.title}</h4>
                  <p className="text-xs text-muted-foreground">{selectedSub.studentName} • {selectedSub.course}</p>
                </div>

                <div className="p-3 border border-border bg-card text-xs text-muted-foreground">
                  <p className="font-bold text-foreground pb-1 border-b border-border/40">Student Submission Text:</p>
                  <p className="pt-2 leading-relaxed italic">
                    "{selectedSub.submissionText}"
                  </p>
                </div>

                {/* Score & Feedback */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Grade</label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full p-2 border border-border bg-card text-foreground font-sans text-xs focus:outline-none"
                    >
                      <option value="A+">A+</option>
                      <option value="A">A</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Feedback Comments</label>
                      <button
                        type="button"
                        onClick={handleAiEvaluate}
                        disabled={isEvaluating}
                        className="text-[10px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1 hover:underline disabled:opacity-40"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10 animate-pulse" />
                        {isEvaluating ? "Evaluating..." : "✨ AI Feedback Copilot"}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="e.g. Excellent vectorized code..."
                      className="w-full p-2.5 border border-border bg-card text-foreground font-sans text-xs focus:outline-none focus:border-foreground"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Register Grade Evaluation
                </button>
              </form>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-xs border border-border bg-surface">
                No active assignment submission selected for grading review.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
