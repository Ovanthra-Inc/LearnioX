"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, ShieldCheck, Check, Upload, Calendar } from "lucide-react";

interface AssignmentDetailPageProps {
  params: Promise<{ id: string }>;
}

const MOCK_ASSIGNMENT_DETAILS: Record<string, {
  title: string;
  courseTitle: string;
  dueDate: string;
  instructions: string;
  status: "pending" | "submitted" | "graded";
  grade?: string;
  score?: string;
  feedback?: string;
}> = {
  "assign-python-1": {
    title: "Optimizing Nested Loops with Vectorized NumPy",
    courseTitle: "Advanced Python for Data Science",
    dueDate: "2026-06-15",
    instructions: "Write a high-performance optimization script. Convert the nested double-loop execution for computing matrix coordinates into vectorized broadcasting operations. Test latency gains using cProfile and save your output log as a PDF/txt file.",
    status: "pending",
  },
  "assign-react-1": {
    title: "Storybook Layout Component Build",
    courseTitle: "Design Systems in React",
    dueDate: "2026-05-20",
    instructions: "Assemble a high-fidelity button component sheet using React and Storybook. Document dark/light variables and accessibility controls.",
    status: "graded",
    grade: "A-",
    score: "92/100",
    feedback: "Excellent layout execution and robust dark-mode CSS variables integration. Ensure component border parameters strictly default to 0px in story configurations.",
  },
  "assign-ux-1": {
    title: "Grayscale High-Fidelity Wireframes Sandbox",
    courseTitle: "Foundations of Structural UI Design",
    dueDate: "2026-06-05",
    instructions: "Submit Figma or PDF mockup sheets showing high-fidelity B&W grids for your checkout and admin dashboard views.",
    status: "submitted",
  }
};

export default function LearnerAssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  const { id } = use(params);

  const [details, setDetails] = useState(MOCK_ASSIGNMENT_DETAILS[id] || MOCK_ASSIGNMENT_DETAILS["assign-python-1"]);
  const [submissionText, setSubmissionText] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0].name);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setDetails((prev) => ({
        ...prev,
        status: "submitted",
      }));
    }, 1500);
  };

  return (
    <div className="max-w-[800px] mx-auto py-6 font-sans space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/learn/assignments"
          className="inline-flex items-center gap-2 text-label-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assignments
        </Link>
      </div>

      {/* Main Details Card */}
      <div className="border border-border bg-card p-6 md:p-8 space-y-6">
        <div className="border-b border-border pb-4 flex justify-between items-start gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              {details.courseTitle}
            </span>
            <h1 className="text-headline-sm md:text-headline-md font-bold text-foreground">
              {details.title}
            </h1>
          </div>
          <span className="text-xs font-mono border border-border px-2.5 py-1 uppercase tracking-wider bg-surface font-bold">
            {details.status}
          </span>
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Instructions</h3>
          <p className="text-body-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {details.instructions}
          </p>
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono uppercase tracking-wider pt-2">
          <Calendar className="w-4 h-4 text-foreground" /> Due Date: {new Date(details.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* Grade Feedback (if Graded) */}
      {details.status === "graded" && (
        <div className="border border-emerald-200 bg-emerald-50/30 p-6 space-y-4">
          <h3 className="text-label-sm font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Instructor Evaluation
          </h3>
          <div className="flex justify-between items-center py-2 border-b border-emerald-100 max-w-sm">
            <span className="text-xs text-emerald-800 font-bold uppercase">Grade Earned</span>
            <span className="text-headline-sm font-bold text-emerald-700">{details.grade} ({details.score})</span>
          </div>
          <div className="space-y-1.5 text-xs text-emerald-800">
            <p className="font-bold">Evaluation Feedback:</p>
            <p className="leading-relaxed">{details.feedback}</p>
          </div>
        </div>
      )}

      {/* Submission Portal */}
      {details.status === "pending" && (
        <form onSubmit={handleFormSubmit} className="border border-border bg-card p-6 md:p-8 space-y-6">
          <h3 className="text-body-md font-bold uppercase tracking-wider border-b border-border pb-3">Submit Assignment</h3>
          
          <div className="space-y-4">
            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Submission Notes</label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Write any comments or code snippets here..."
                rows={4}
                className="w-full p-3 border border-border bg-surface text-foreground font-sans text-sm focus:outline-none focus:border-foreground resize-none"
              />
            </div>

            {/* File Upload mock */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold block">Attach Assignment File</label>
              <div className="border border-dashed border-border p-8 text-center bg-surface flex flex-col items-center gap-3 relative cursor-pointer hover:bg-surface-container transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  {selectedFile ? `File: ${selectedFile}` : "Drag and drop or click to upload PDF/zip"}
                </p>
                <p className="text-[10px] text-zinc-400">Max file size 25MB.</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!submissionText && !selectedFile)}
            className="w-full py-4 bg-foreground text-background text-label-md uppercase tracking-widest font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {isSubmitting ? "Uploading Submission..." : "Submit to Instructor"}
          </button>
        </form>
      )}

      {/* Submission Success (if Submitted) */}
      {details.status === "submitted" && (
        <div className="border border-border bg-card p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center mx-auto rounded-none">
            <Check className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-body-md font-bold uppercase tracking-wider text-foreground">Assignment Submitted</h3>
            <p className="text-xs text-muted-foreground">Your work is in queue for instructor grading.</p>
          </div>
        </div>
      )}
    </div>
  );
}
