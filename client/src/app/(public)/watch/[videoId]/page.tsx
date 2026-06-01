"use client";

import { use, useState } from "react";
import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import { ArrowLeft, Play, Lock, ShieldCheck } from "lucide-react";

interface WatchPageProps {
  params: Promise<{ videoId: string }>;
}

export default function PublicWatchPage({ params }: WatchPageProps) {
  const { videoId } = use(params);

  // Search for the video lesson in all courses
  let courseMatch: any = null;
  let moduleMatch: any = null;
  let lessonMatch: any = null;

  for (const course of MOCK_COURSES) {
    for (const mod of course.modules) {
      const lesson = mod.lessons.find((l) => l.id === videoId);
      if (lesson) {
        courseMatch = course;
        moduleMatch = mod;
        lessonMatch = lesson;
        break;
      }
    }
    if (lessonMatch) break;
  }

  // Fallback to first preview lesson if ID doesn't match
  if (!lessonMatch) {
    const firstPreview = MOCK_COURSES[0]?.modules[0]?.lessons.find((l) => l.isPreview && l.type === "video");
    if (firstPreview) {
      courseMatch = MOCK_COURSES[0];
      moduleMatch = MOCK_COURSES[0].modules[0];
      lessonMatch = firstPreview;
    }
  }

  if (!lessonMatch) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 py-24 text-center space-y-6">
        <h1 className="text-headline-md font-bold text-foreground">Video Not Found</h1>
        <p className="text-muted-foreground">The request video could not be located.</p>
        <Link
          href="/free-videos"
          className="inline-block px-6 py-3 bg-foreground text-background text-label-md uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
        >
          View Free Videos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 font-sans space-y-6">
      {/* Back button */}
      <div>
        <Link
          href={`/course/${courseMatch.slug}`}
          className="inline-flex items-center gap-2 text-label-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {courseMatch.title}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Video Player & Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Player Wrapper */}
          <div className="aspect-video bg-black border border-border relative overflow-hidden flex items-center justify-center">
            {lessonMatch.videoUrl ? (
              <video
                src={lessonMatch.videoUrl}
                controls
                className="w-full h-full object-contain"
                poster={courseMatch.thumbnail}
              />
            ) : (
              <div className="text-center p-6 space-y-3">
                <Play className="w-12 h-12 mx-auto text-muted-foreground animate-pulse" />
                <p className="text-body-sm text-zinc-400">Loading mock playback node...</p>
              </div>
            )}
          </div>

          {/* Video Metadata */}
          <div className="space-y-4 border-b border-border pb-6">
            <div className="flex items-center gap-3 text-label-sm uppercase tracking-wider text-muted-foreground font-bold">
              <span>{courseMatch.institutionName}</span>
              <span>•</span>
              <span>{moduleMatch.title}</span>
            </div>
            <h1 className="text-headline-md font-bold text-foreground">
              {lessonMatch.title}
            </h1>
            <p className="text-body-sm text-muted-foreground leading-relaxed">
              {lessonMatch.description || "In this lecture, we examine core concepts in an open sandbox format. Access graded assignments and quizzes by enrolling in the full course program."}
            </p>
          </div>

          {/* Comments section mock */}
          <div className="space-y-4">
            <h3 className="text-body-md font-bold uppercase tracking-wider">Comments (2)</h3>
            <div className="space-y-4">
              <div className="p-4 border border-border bg-card text-sm space-y-2">
                <p className="font-bold text-foreground">Ramesh Kumar <span className="text-[10px] text-muted-foreground font-normal ml-2">2 days ago</span></p>
                <p className="text-muted-foreground">Very clear explanation of garbage collection. Are there more practice questions on decorators?</p>
              </div>
              <div className="p-4 border border-border bg-card text-sm space-y-2">
                <p className="font-bold text-foreground">Ananya Sharma <span className="text-[10px] text-muted-foreground font-normal ml-2">1 week ago</span></p>
                <p className="text-muted-foreground">Loved this introduction! Buying the full course today.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Course outline and CTA */}
        <div className="space-y-6">
          {/* Enrol CTA */}
          <div className="border border-border bg-foreground text-background p-6 space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-background/60">
              Full Program Access
            </span>
            <h3 className="text-headline-sm font-bold leading-tight">
              Unlock All Lessons & Resources
            </h3>
            <p className="text-xs text-background/70 leading-relaxed">
              Unlock all modules, download worksheets, ask doubts to mentors directly under lectures, take exams, and get a certified degree badge on completion.
            </p>
            <Link
              href={`/checkout/${courseMatch.id}`}
              className="w-full text-center block bg-background text-foreground text-label-md uppercase tracking-wider font-bold py-3.5 hover:opacity-95 transition-opacity"
            >
              Enroll in Program
            </Link>
          </div>

          {/* Module Outline */}
          <div className="border border-border bg-card">
            <div className="p-4 border-b border-border bg-surface">
              <h4 className="text-label-sm font-bold uppercase tracking-wider text-foreground">
                Course Syllabus
              </h4>
            </div>
            <div className="divide-y divide-border/60 max-h-[350px] overflow-y-auto">
              {moduleMatch.lessons.map((les: any) => {
                const isActive = les.id === videoId;
                return (
                  <div
                    key={les.id}
                    className={`p-4 flex items-start justify-between text-xs gap-3 ${
                      isActive ? "bg-surface-container font-bold border-l-2 border-foreground" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <Play className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isActive ? "text-foreground fill-current" : "text-muted-foreground"}`} />
                      <span className={isActive ? "text-foreground" : "text-muted-foreground"}>
                        {les.title}
                      </span>
                    </div>
                    {les.isPreview ? (
                      <Link
                        href={`/watch/${les.id}`}
                        className="text-[9px] uppercase font-bold text-foreground hover:underline flex-shrink-0"
                      >
                        Watch
                      </Link>
                    ) : (
                      <Lock className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
