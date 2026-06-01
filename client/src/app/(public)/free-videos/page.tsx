"use client";

import Link from "next/link";
import { Play, Clock, BookOpen, ExternalLink } from "lucide-react";
import { MOCK_COURSES } from "@/lib/mock-data/courses";
import { formatDuration } from "@/lib/utils";

export default function FreeVideosPage() {
  // Extract all preview lessons from all courses
  const freeVideos = MOCK_COURSES.flatMap((course) => 
    course.modules.flatMap((module) => 
      module.lessons
        .filter((lesson) => lesson.isPreview && lesson.type === "video")
        .map((lesson) => ({
          ...lesson,
          courseTitle: course.title,
          courseSlug: course.slug,
          institutionName: course.institutionName,
          institutionSlug: course.institutionSlug,
          moduleTitle: module.title,
          thumbnail: course.thumbnail,
        }))
    )
  );

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-12 space-y-8 font-sans">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-surface-container border border-border px-3 py-1">
          Open Resources
        </span>
        <h1 className="text-headline-lg font-bold text-foreground mt-4 leading-tight">
          Free Video Lessons
        </h1>
        <p className="text-body-md text-muted-foreground mt-2">
          Start learning immediately. Watch preview lectures from our verified institutions without signing up.
        </p>
      </div>

      {/* Videos List */}
      {freeVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freeVideos.map((video) => (
            <div key={video.id} className="border border-border bg-card group flex flex-col justify-between">
              {/* Image Preview */}
              <div className="relative aspect-video bg-surface-container border-b border-border overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                  <div className="w-10 h-10 bg-background flex items-center justify-center rounded-none shadow-md group-hover:bg-foreground group-hover:text-background transition-colors">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                </div>
                {video.duration && (
                  <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-0.5 text-[10px] font-mono text-white font-bold tracking-wider uppercase">
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>

              {/* Text Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    {video.institutionName}
                  </span>
                  <h3 className="text-body-md font-bold text-foreground leading-snug group-hover:underline">
                    {video.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {video.description || "Learn core foundational topics in this free lecture segment."}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[140px]">{video.courseTitle}</span>
                  </span>
                  <Link
                    href={`/watch/${video.id}`}
                    className="font-bold uppercase tracking-wider text-foreground hover:underline flex items-center gap-1"
                  >
                    Watch Now <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-border p-16 text-center text-muted-foreground space-y-4">
          <Play className="w-12 h-12 mx-auto opacity-40 text-foreground" />
          <h3 className="text-headline-sm font-bold text-foreground">No free lessons published</h3>
          <p className="text-body-sm text-muted-foreground max-w-sm mx-auto">
            All current lectures are currently premium access. Check out our pricing packages or register for announcements.
          </p>
        </div>
      )}
    </div>
  );
}
