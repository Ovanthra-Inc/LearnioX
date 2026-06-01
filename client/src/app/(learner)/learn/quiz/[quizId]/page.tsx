"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HelpCircle, Clock, Check, X, ArrowLeft, ArrowRight, Award } from "lucide-react";

interface QuizPageProps {
  params: Promise<{ quizId: string }>;
}

const MOCK_QUESTIONS = [
  {
    id: "q1",
    question: "Which of the following is true about garbage collection in CPython?",
    options: [
      "It relies exclusively on generational tracing collectors.",
      "It uses reference counting as the primary mechanism, supplemented by a generational cycle detector.",
      "Garbage collection must be manually triggered for all objects.",
      "CPython does not support automatic memory reclamation."
    ],
    correctIdx: 1,
  },
  {
    id: "q2",
    question: "What does the @wraps decorator from functools accomplish?",
    options: [
      "It speeds up execution of the wrapped function using memoization.",
      "It forces the wrapped function to run asynchronously.",
      "It copies metadata (like __name__ and __doc__) from the original function to the decorator wrapper.",
      "It automatically logs function execution parameters."
    ],
    correctIdx: 2,
  },
  {
    id: "q3",
    question: "What occurs during Python decorator execution?",
    options: [
      "Decorators are executed dynamically every time the function is called.",
      "Decorators are executed at function definition time (import time).",
      "Decorators disable python memory garbage collection.",
      "Decorators must return a string literal representing execution logs."
    ],
    correctIdx: 1,
  }
];

export default function QuizTakingPage({ params }: QuizPageProps) {
  const { quizId } = use(params);
  const router = useRouter();

  // Quiz States
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  // Proctoring States
  const [proctorLogs, setProctorLogs] = useState<{ event: string; time: string }[]>([]);
  const [showProctorModal, setShowProctorModal] = useState(false);
  const [proctorToast, setProctorToast] = useState<string | null>(null);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  // Auto-submit on time expiration
  useEffect(() => {
    if (timeLeft === 0 && !isFinished) {
      handleSubmit();
    }
  }, [timeLeft]);

  // Proctoring Focus & Clipboard Listeners
  useEffect(() => {
    if (isFinished) return;

    const recordViolation = (eventName: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setProctorLogs((prev) => [...prev, { event: eventName, time: timestamp }]);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation("Tab Switched (Navigated Away)");
        setShowProctorModal(true);
      }
    };

    const handleWindowBlur = () => {
      recordViolation("Window Focus Lost (Minimized / Clicked Away)");
      setShowProctorModal(true);
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation("Copy Attempt Blocked");
      setProctorToast("⚠️ Copying is disabled under active proctoring lockdown.");
      setTimeout(() => setProctorToast(null), 3000);
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation("Paste Attempt Blocked");
      setProctorToast("⚠️ Pasting is disabled under active proctoring lockdown.");
      setTimeout(() => setProctorToast(null), 3000);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, [isFinished]);

  const handleSelectOption = (optIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optIdx,
    }));
  };

  const handleNext = () => {
    if (currentIdx < MOCK_QUESTIONS.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    let correctCount = 0;
    MOCK_QUESTIONS.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIdx) {
        correctCount += 1;
      }
    });
    setScore(Math.round((correctCount / MOCK_QUESTIONS.length) * 100));
    setIsFinished(true);
  };

  // Formatting time
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  if (isFinished) {
    return (
      <div className="max-w-[600px] mx-auto py-12 space-y-8 font-sans">
        <div className="border border-border bg-card p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-foreground text-background flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-headline-md font-bold text-foreground">Quiz Completed</h1>
            <p className="text-body-sm text-muted-foreground uppercase tracking-widest">
              Review your assessment score
            </p>
          </div>

          {/* Score display */}
          <div className="py-6 border-y border-border flex justify-between items-center px-4 max-w-sm mx-auto">
            <span className="font-bold text-muted-foreground uppercase text-xs">Total Grade</span>
            <span className={`text-headline-md font-bold ${score >= 70 ? "text-emerald-600" : "text-amber-600"}`}>
              {score}%
            </span>
          </div>

          {/* Breakdown summary */}
          <div className="text-left space-y-4">
            <h4 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Answers Review</h4>
            <div className="space-y-3">
              {MOCK_QUESTIONS.map((q, idx) => {
                const wasCorrect = selectedAnswers[idx] === q.correctIdx;
                return (
                  <div key={q.id} className="p-3 border border-border bg-surface text-xs space-y-2">
                    <p className="font-bold text-foreground flex gap-1.5 items-start">
                      <span className="font-mono">{idx + 1}.</span> {q.question}
                    </p>
                    <div className="text-muted-foreground pl-4 space-y-1">
                      <p className={wasCorrect ? "text-emerald-600 font-semibold" : "text-rose-500 font-semibold"}>
                        Your answer: {selectedAnswers[idx] !== undefined ? q.options[selectedAnswers[idx]] : "[No Answer]"}
                      </p>
                      {!wasCorrect && (
                        <p className="text-foreground font-semibold">
                          Correct: {q.options[q.correctIdx]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Proctoring Log Verification */}
          <div className="text-left space-y-3 pt-6 border-t border-border">
            <h4 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Proctor Integrity Audit</h4>
            
            {proctorLogs.length === 0 ? (
              <div className="p-4 border border-border bg-surface-container flex items-center justify-between text-xs font-mono">
                <span className="text-foreground uppercase font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 inline-block rounded-full" />
                  Lockdown Verified
                </span>
                <span className="text-muted-foreground uppercase text-[10px]">Zero Focus Violations</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-semibold flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <span className="font-bold">⚠️ INTEGRITY WARNING:</span>
                    <span>{proctorLogs.length} security flags registered.</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-sans font-normal leading-normal">
                    This exam has been flagged for manual administrative audit. Repeated tab switches or focus changes disrupt lockdown enforcement.
                  </p>
                </div>
                <div className="border border-border bg-surface divide-y divide-border/60 font-mono text-[10px]">
                  {proctorLogs.map((log, idx) => (
                    <div key={idx} className="p-2.5 flex justify-between items-center text-muted-foreground">
                      <span className="text-foreground uppercase font-bold">{log.event}</span>
                      <span>{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-4">
            <Link
              href="/learn/tests"
              className="flex-1 text-center py-3 border border-border text-label-sm uppercase tracking-wider font-bold text-foreground hover:bg-surface-container transition-colors"
            >
              Back to Tests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeQuestion = MOCK_QUESTIONS[currentIdx];

  return (
    <div className="max-w-[800px] mx-auto py-6 font-sans space-y-6">
      {/* Quiz Header Info */}
      <div className="flex justify-between items-center border border-border bg-card p-4">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Assessment Mode</span>
          <h2 className="text-body-md font-bold text-foreground mt-0.5">Core Python Syntax Exam</h2>
        </div>
        <div className="flex items-center gap-2 border border-border bg-surface px-4 py-2 font-mono text-foreground font-bold">
          <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Stepper bar */}
      <div className="flex gap-1 h-1.5 border border-border bg-surface-container overflow-hidden">
        {MOCK_QUESTIONS.map((_, idx) => (
          <div
            key={idx}
            className={`flex-1 h-full transition-colors ${
              idx <= currentIdx ? "bg-foreground" : "bg-transparent"
            }`}
          />
        ))}
      </div>

      {/* Question Card */}
      <div className="border border-border bg-card p-6 md:p-8 space-y-6">
        {/* Question text */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Question {currentIdx + 1} of {MOCK_QUESTIONS.length}
          </span>
          <h3 className="text-body-lg font-bold text-foreground leading-snug">
            {activeQuestion.question}
          </h3>
        </div>

        {/* Options list */}
        <div className="space-y-3">
          {activeQuestion.options.map((opt, optIdx) => {
            const isSelected = selectedAnswers[currentIdx] === optIdx;
            return (
              <button
                key={optIdx}
                onClick={() => handleSelectOption(optIdx)}
                className={`w-full p-4 border text-left text-body-sm transition-all flex gap-3 items-center ${
                  isSelected
                    ? "border-foreground bg-foreground text-background font-bold"
                    : "border-border hover:bg-surface-container text-foreground"
                }`}
              >
                <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 ${isSelected ? "border-background" : "border-border"}`}>
                  {isSelected && <div className="w-2 h-2 bg-background" />}
                </div>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="px-5 py-3 border border-border text-label-sm uppercase tracking-wider font-bold text-foreground hover:bg-surface-container disabled:opacity-40 transition-all flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>

        {currentIdx === MOCK_QUESTIONS.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-foreground text-background text-label-sm uppercase tracking-widest font-bold hover:opacity-90 transition-opacity"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-5 py-3 border border-border text-label-sm uppercase tracking-wider font-bold text-foreground hover:bg-surface-container transition-all flex items-center gap-1"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Proctoring Warning Modal */}
      {showProctorModal && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-[200] p-4 font-sans">
          <div className="border-4 border-foreground bg-card max-w-md w-full p-8 text-center space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-16 h-16 border-2 border-foreground bg-foreground text-background flex items-center justify-center mx-auto rounded-none">
              <span className="text-xl font-bold font-mono">⚠️</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-headline-sm font-bold text-foreground uppercase tracking-wider">Security Warning</h2>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Exam Proctoring Lockdown Active</p>
            </div>
            <p className="text-body-sm text-foreground leading-relaxed">
              We detected that you switched tabs, minimized the browser, or lost window focus. All window adjustments are audited for assessment integrity.
            </p>
            <div className="bg-surface border border-border p-3 text-[10px] text-muted-foreground font-mono">
              IP, viewport actions, and timestamps are actively transmitted to course proctors.
            </div>
            <button
              onClick={() => setShowProctorModal(false)}
              className="w-full py-3 bg-foreground text-background text-label-sm uppercase tracking-widest font-bold hover:opacity-90 transition-opacity"
            >
              Resume Assessment
            </button>
          </div>
        </div>
      )}

      {/* Proctor Notification Toast */}
      {proctorToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-zinc-950 text-white text-[11px] font-bold uppercase tracking-wider px-6 py-3 shadow-lg border border-zinc-800 animate-fade-in font-mono flex items-center gap-2">
          <span>{proctorToast}</span>
        </div>
      )}
    </div>
  );
}
