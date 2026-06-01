"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, ThumbsUp, MessageSquare, Plus, ArrowRight } from "lucide-react";
import { MOCK_DOUBTS } from "@/lib/mock-data/learner";
import { formatRelativeTime } from "@/lib/utils";

export default function LearnerDoubtsPage() {
  const [doubts, setDoubts] = useState(MOCK_DOUBTS.filter((d) => d.userId === "user-learner-1" || d.userId === "user-learner-2")); // Mock user doubts
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "answered">("all");

  const filteredDoubts = doubts.filter((d) => {
    if (activeTab === "pending") return d.status === "pending";
    if (activeTab === "answered") return d.status === "answered";
    return true;
  });

  const handleUpvote = (id: string) => {
    setDoubts(prev =>
      prev.map((d) => (d.id === id ? { ...d, upvotes: d.upvotes + 1 } : d))
    );
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">My Doubts</h1>
          <p className="text-body-sm text-muted-foreground">
            Track and check status of questions you've asked in courses.
          </p>
        </div>
        <Link
          href="/learn/courses"
          className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-label-md uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Ask a Question
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card">
        {[
          { id: "all", label: "All Doubts" },
          { id: "pending", label: `Pending (${doubts.filter(d => d.status === "pending").length})` },
          { id: "answered", label: `Answered (${doubts.filter(d => d.status === "answered").length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-4 text-label-sm uppercase tracking-widest font-bold border-r border-border transition-colors ${
              activeTab === tab.id
                ? "bg-surface text-foreground border-b-2 border-b-foreground"
                : "text-muted-foreground hover:bg-surface-container"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Doubts List */}
      {filteredDoubts.length === 0 ? (
        <div className="border border-border p-16 text-center space-y-4 bg-card">
          <HelpCircle className="w-12 h-12 text-muted-foreground opacity-40 mx-auto" />
          <p className="text-body-lg font-bold uppercase text-muted-foreground tracking-wider">No doubts found</p>
          <p className="text-body-sm text-muted-foreground max-w-sm mx-auto">
            You don't have any doubts in this section. Go to your courses watchlist to ask a new question.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDoubts.map((doubt) => (
            <div key={doubt.id} className="border border-border bg-card p-6 flex flex-col md:flex-row gap-6 justify-between items-start transition-colors hover:border-foreground/50">
              
              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider">
                    Course:
                  </span>
                  <Link href={`/course/${doubt.courseId}`} className="font-bold underline text-foreground hover:text-muted-foreground truncate max-w-[200px]">
                    {doubt.courseTitle}
                  </Link>
                  {doubt.lessonTitle && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground truncate max-w-[150px]">
                        Lesson: {doubt.lessonTitle}
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{formatRelativeTime(doubt.createdAt)}</span>
                </div>

                <h3 className="text-body-lg font-bold text-foreground">
                  {doubt.question}
                </h3>
                
                {doubt.description && (
                  <p className="text-body-sm text-muted-foreground leading-relaxed">
                    {doubt.description}
                  </p>
                )}

                {/* Answer Box */}
                {doubt.status === "answered" && doubt.answer ? (
                  <div className="p-4 bg-surface border-l-2 border-l-foreground border border-border mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-foreground" />
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Answer from {doubt.answeredByName || "Instructor"}
                      </p>
                      {doubt.answeredAt && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({new Date(doubt.answeredAt).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                    <p className="text-body-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {doubt.answer}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-surface border border-dashed border-border mt-2">
                    <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" /> Awaiting instructor response. Usually takes less than 24 hours.
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar: Upvotes & Status Badge */}
              <div className="flex flex-row md:flex-col items-center md:items-end gap-3 flex-shrink-0 w-full md:w-auto border-t md:border-t-0 border-border pt-4 md:pt-0">
                <span
                  className={`px-3 py-1 text-[10px] uppercase font-bold border ${
                    doubt.status === "answered"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                  }`}
                >
                  {doubt.status}
                </span>

                <button
                  onClick={() => handleUpvote(doubt.id)}
                  className="flex items-center gap-2 px-3 py-1.5 border border-border hover:border-foreground hover:bg-surface text-xs font-bold transition-all ml-auto md:ml-0"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{doubt.upvotes} Upvotes</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
