"use client";

import { use, useState } from "react";
import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import { ArrowLeft, Check, Plus, Megaphone, Trash2 } from "lucide-react";

interface CourseAnnouncementsProps {
  params: Promise<{ id: string }>;
}

export default function CourseAnnouncementsPage({ params }: CourseAnnouncementsProps) {
  const { id } = use(params);
  const course = MOCK_COURSES.find((c) => c.id === id) || MOCK_COURSES[0];

  const [announcements, setAnnouncements] = useState([
    { id: "a1", title: "MLOps NumPy Optimization Lab Guide", body: "Check Module 2 lessons for the attached optimizer code worksheets.", date: "2 days ago" },
    { id: "a2", title: "Weekend Q&A Session Scheduled", body: "Join us this Saturday at 10 AM IST for live doubt solving.", date: "1 week ago" }
  ]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setAnnouncements([
      { id: `ann-${Date.now()}`, title, body, date: "Just now" },
      ...announcements
    ]);
    setTitle("");
    setBody("");
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDelete = (annId: string) => {
    setAnnouncements(announcements.filter((a) => a.id !== annId));
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

      {/* Announcements Manager */}
      <div className="border border-border bg-card p-6 md:p-8 space-y-6">
        <div className="border-b border-border pb-4">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Public Relations</span>
          <h1 className="text-headline-sm font-bold text-foreground mt-0.5">{course.title} — Announcements</h1>
        </div>

        {isSaved && (
          <div className="p-4 border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" /> Announcement published to classroom community feeds!
          </div>
        )}

        {/* Post Form */}
        <form onSubmit={handlePost} className="border border-border bg-surface p-4 space-y-3">
          <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Post New Announcement</h3>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement Title..."
            className="w-full p-2.5 border border-border bg-card text-foreground font-sans text-xs focus:outline-none focus:border-foreground"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your announcement contents here..."
            rows={3}
            className="w-full p-2.5 border border-border bg-card text-foreground font-sans text-xs focus:outline-none focus:border-foreground resize-none"
          />
          <button
            type="submit"
            className="w-full py-2 bg-foreground text-background text-label-sm uppercase tracking-wider font-bold hover:opacity-90 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Publish Announcement
          </button>
        </form>

        {/* List of past posts */}
        <div className="space-y-4 pt-2">
          <h3 className="text-label-sm font-bold uppercase tracking-wider text-foreground">Posted Announcements</h3>
          <div className="divide-y divide-border border border-border bg-card">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 flex gap-4 items-start group">
                <div className="w-9 h-9 border border-border bg-surface flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-body-sm font-bold text-foreground truncate">{ann.title}</h4>
                    <span className="text-[10px] text-muted-foreground font-mono">{ann.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ann.body}</p>
                </div>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface border border-transparent hover:border-border text-muted-foreground hover:text-rose-600 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
