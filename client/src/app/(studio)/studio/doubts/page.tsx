"use client";

import { useState } from "react";
import { MOCK_DOUBTS } from "@/lib/mock-data/learner";
import { formatRelativeTime } from "@/lib/utils";
import { BadgeStatus } from "@/components/shared/ui-elements";
import { HelpCircle, ThumbsUp, Sparkles, Bot, Send } from "lucide-react";

export default function StudioDoubtsPage() {
  const [doubts, setDoubts] = useState(MOCK_DOUBTS);
  const [activeAnswerDoubtId, setActiveAnswerDoubtId] = useState<string | null>(null);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [ragLoadingId, setRagLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | "Pending" | "Answered">("Pending");

  const pending = doubts.filter((d) => d.status === "pending");
  const answered = doubts.filter((d) => d.status === "answered");

  const filteredDoubts = doubts.filter((d) => {
    if (filter === "All") return true;
    if (filter === "Pending") return d.status === "pending";
    if (filter === "Answered") return d.status === "answered";
    return true;
  });

  const handleGenerateRAG = (doubtId: string, question: string) => {
    setRagLoadingId(doubtId);
    setTimeout(() => {
      let draftText = "";
      if (question.toLowerCase().includes("garbage") || question.toLowerCase().includes("memory")) {
        draftText = `Based on the lecture transcript from 'Introduction to Advanced Python' (at 04:15), the garbage collector in CPython relies primarily on reference counting. However, to detect reference cycles (where objects reference each other and their count never drops to 0), Python employs a generational cycle-detecting algorithm. If you encounter cyclic leaks, use the 'gc' module's 'gc.collect()' call or structural weak references ('weakref').`;
      } else if (question.toLowerCase().includes("decorator") || question.toLowerCase().includes("wrap")) {
        draftText = `Based on the lecture transcript from 'Decorators & Wrappers' (at 10:30), the '@wraps' decorator from 'functools' copies the name, docstring, and annotations of the original function onto the wrapper. Without '@wraps', decorators overwrite the metadata of decorated functions, which breaks reflection, docs generation, and debugging tools.`;
      } else {
        draftText = `Based on the course curriculum materials and lesson context, the issue is typically caused by incorrect scoping or mismatched dependencies. Ensure you import the proper elements from standard libraries and verify variable lifetimes inside function decorators.`;
      }
      setDraftAnswers((prev) => ({ ...prev, [doubtId]: draftText }));
      setRagLoadingId(null);
    }, 1200);
  };

  const handleSubmitAnswer = (doubtId: string) => {
    const answerText = draftAnswers[doubtId] || "";
    if (!answerText.trim()) return;

    setDoubts((prev) =>
      prev.map((d) =>
        d.id === doubtId
          ? {
              ...d,
              status: "answered" as const,
              answer: answerText,
              answeredByName: "Lead Instructor (AI Co-authored)",
              updatedAt: new Date().toISOString()
            }
          : d
      )
    );
    setActiveAnswerDoubtId(null);
  };

  const DoubtCard = ({ doubt }: { doubt: typeof MOCK_DOUBTS[0] }) => (
    <div className="p-5 border-b last:border-b-0 border-border hover:bg-surface-container transition-colors">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 bg-surface-container-high border border-border flex items-center justify-center text-label-md font-bold flex-shrink-0">
            {doubt.userName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-body-sm font-bold text-foreground">{doubt.userName}</p>
            <p className="text-label-sm text-muted-foreground uppercase">{doubt.courseTitle.split(" ").slice(0, 3).join(" ")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-1 text-label-sm text-muted-foreground font-mono">
            <ThumbsUp className="w-3 h-3" /> {doubt.upvotes}
          </span>
          <BadgeStatus status={doubt.status === "answered" ? "success" : "pending"} />
        </div>
      </div>
      <h3 className="text-body-md font-semibold text-foreground mb-1">{doubt.question}</h3>
      {doubt.description && (
        <p className="text-body-sm text-muted-foreground line-clamp-2 mb-3 whitespace-pre-wrap">{doubt.description}</p>
      )}
      
      {doubt.answer && (
        <div className="bg-surface-container border border-border p-4 mt-3">
          <p className="text-xs font-bold uppercase text-foreground tracking-widest mb-1 flex items-center gap-1">
            <Bot className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
            Answer by {doubt.answeredByName}
          </p>
          <p className="text-body-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{doubt.answer}</p>
        </div>
      )}

      {/* Answer Composition Panel */}
      {activeAnswerDoubtId === doubt.id && (
        <div className="mt-4 border border-border p-4 bg-surface space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-foreground flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" /> RAG Auto-Responder Panel
            </span>
            <button
              type="button"
              onClick={() => handleGenerateRAG(doubt.id, doubt.question)}
              disabled={ragLoadingId === doubt.id}
              className="px-3 py-1 bg-foreground text-background text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Sparkles className="w-3 h-3 text-amber-400 fill-current animate-pulse" />
              {ragLoadingId === doubt.id ? "Searching transcripts..." : "Generate RAG Draft"}
            </button>
          </div>
          
          {ragLoadingId === doubt.id && (
            <div className="py-2 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <div className="w-3 h-3 border border-t-transparent border-foreground animate-spin rounded-full" />
              <span>Querying video transcripts & code repositories...</span>
            </div>
          )}

          <textarea
            value={draftAnswers[doubt.id] || ""}
            onChange={(e) => setDraftAnswers({ ...draftAnswers, [doubt.id]: e.target.value })}
            placeholder="Type your response here, or click the RAG Draft button to auto-generate from video lectures..."
            className="w-full p-3 border border-border bg-card text-foreground font-sans text-xs focus:outline-none focus:border-foreground min-h-[100px] resize-none rounded-none"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveAnswerDoubtId(null)}
              className="px-3 py-1.5 border border-border text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmitAnswer(doubt.id)}
              disabled={!(draftAnswers[doubt.id] || "").trim()}
              className="px-3 py-1.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Submit Answer
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <p className="text-label-sm text-muted-foreground uppercase font-mono">{formatRelativeTime(doubt.createdAt)}</p>
        {doubt.status === "pending" && activeAnswerDoubtId !== doubt.id && (
          <button
            onClick={() => setActiveAnswerDoubtId(doubt.id)}
            className="px-4 py-2 bg-foreground text-background text-label-md uppercase tracking-wider hover:opacity-80 transition-opacity"
          >
            Answer
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Doubts Queue</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            {pending.length} pending · {answered.length} answered
          </p>
        </div>
        <div className="flex gap-3">
          {(["All", "Pending", "Answered"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 border text-label-md uppercase tracking-wider transition-colors ${
                f === filter
                  ? "bg-foreground text-background border-foreground font-bold"
                  : "border-border text-muted-foreground hover:border-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-headline-sm font-bold mb-4 pb-3 border-b border-border flex items-center gap-2">
          <HelpCircle className="w-5 h-5" /> {filter} Queue ({filteredDoubts.length})
        </h2>
        {filteredDoubts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border border-dashed border-border bg-surface">
            <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No doubts matching criteria in this category.</p>
          </div>
        ) : (
          <div className="border border-border bg-card">
            {filteredDoubts.map((d) => (
              <DoubtCard key={d.id} doubt={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

