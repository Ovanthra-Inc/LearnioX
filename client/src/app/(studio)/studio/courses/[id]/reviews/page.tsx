"use client";

import { use, useState } from "react";
import Link from "next/link";
import { MOCK_COURSES, MOCK_COURSE_REVIEWS } from "@/lib/mock-data/courses";
import { ArrowLeft, Check, Star, MessageSquare } from "lucide-react";

interface CourseReviewsProps {
  params: Promise<{ id: string }>;
}

export default function CourseReviewsPage({ params }: CourseReviewsProps) {
  const { id } = use(params);
  const course = MOCK_COURSES.find((c) => c.id === id) || MOCK_COURSES[0];

  const [reviews, setReviews] = useState(
    MOCK_COURSE_REVIEWS.filter((r) => r.courseId === course.id)
  );

  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replied, setReplied] = useState<Record<string, boolean>>({});

  const handlePostReply = (revId: string) => {
    if (!replyText[revId]?.trim()) return;
    setReplied({
      ...replied,
      [revId]: true
    });
  };

  return (
    <div className="max-w-[800px] mx-auto py-6 font-sans space-y-6">
      {/* Navigation */}
      <div>
        <Link
          href="/studio/courses"
          className="inline-flex items-center gap-2 text-label-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>
      </div>

      {/* Reviews Queue */}
      <div className="border border-border bg-card p-6 md:p-8 space-y-6">
        <div className="border-b border-border pb-4">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Feedback Moderation</span>
          <h1 className="text-headline-sm font-bold text-foreground mt-0.5">{course.title} — Reviews</h1>
        </div>

        {/* Reviews list */}
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <div key={rev.id} className="border border-border p-5 bg-card space-y-4">
                <div className="flex justify-between items-start text-xs text-muted-foreground">
                  <div>
                    <p className="font-bold text-foreground">{rev.userName}</p>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? "text-foreground fill-foreground" : "text-muted-foreground opacity-30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="font-mono">{new Date(rev.createdAt).toLocaleDateString()}</span>
                </div>
                
                <p className="text-body-sm text-muted-foreground leading-relaxed">{rev.comment}</p>

                {/* Reply section */}
                <div className="pt-3 border-t border-border/60 space-y-3">
                  {replied[rev.id] ? (
                    <div className="p-3 bg-surface border border-border text-xs text-foreground space-y-1">
                      <p className="font-bold">✓ Replied as Academy Owner:</p>
                      <p className="text-muted-foreground leading-relaxed">{replyText[rev.id]}</p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyText[rev.id] || ""}
                        onChange={(e) => setReplyText({ ...replyText, [rev.id]: e.target.value })}
                        placeholder="Draft response reply..."
                        className="flex-1 p-2 border border-border bg-surface text-foreground font-sans text-xs focus:outline-none focus:border-foreground"
                      />
                      <button
                        onClick={() => handlePostReply(rev.id)}
                        className="px-4 py-2 bg-foreground text-background text-xs uppercase tracking-wider font-bold hover:opacity-90"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="border border-border p-12 text-center text-muted-foreground">
              No course feedback submitted.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
